import React, { useState, useRef } from 'react';
import { storage, auth } from '../../lib/firebase';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, X, File, Image as ImageIcon, Film, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import imageCompression from 'browser-image-compression';

interface MediaUploadProps {
  onUpload: (url: string, type: 'image' | 'video' | 'file', name: string) => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
  label?: string;
  isSquare?: boolean;
}

export default function MediaUpload({ 
  onUpload, 
  allowedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx'], 
  maxSize = 100, // Increased to 100MB for larger media clusters
  className,
  label = "Upload Media",
  isSquare = false
}: MediaUploadProps) {
  // Runtime audit of limits
  console.log(`[STORAGE] MediaUpload node active. Max payload limit: ${maxSize}MB`);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      throw new Error(`Payload exceeds ${maxSize}MB. Please optimize or use a smaller cluster.`);
    }
    
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.split('*')[0]);
      }
      return file.type === type || file.name.endsWith(type);
    });

    if (!isAllowed) {
      throw new Error(`Data format ${file.type} is not authorized for this node.`);
    }
  };

  const processImage = async (file: File): Promise<File | Blob> => {
    if (!file.type.startsWith('image/')) return file;
    
    setUploadStatus("Optimizing Bytes...");
    try {
      const options = {
        maxSizeMB: 1, // Target 1MB
        maxWidthOrHeight: 1200, // Max 1200px
        useWebWorker: true,
        onProgress: (p: number) => {
          // Compression progress shows up as 0-10% of total upload bar
          setProgress(p * 0.1); 
        }
      };
      
      const compressedBlob = await imageCompression(file, options);
      return compressedBlob;
    } catch (err) {
      console.warn("Compression node failed, using raw data segment:", err);
      return file;
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (!auth.currentUser) {
      setError("DANGER: Unauthorized session. Sign in required.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);
    setUploadStatus("Initializing...");

    try {
      validateFile(file);
      
      const dataToUpload = await processImage(file);
      setUploadStatus("Transmitting to Cloud...");
      
      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'file';
      
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${safeName}`;
      const storagePath = `media/${auth.currentUser.uid}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Use atomic upload for images (compressed < 1MB) for better stability
      if (type === 'image') {
        try {
          const result = await uploadBytes(storageRef, dataToUpload);
          const downloadURL = await getDownloadURL(result.ref);
          console.log(`[STORAGE] Atomic upload success: ${downloadURL}`);
          onUpload(downloadURL, type, file.name);
          setUploadStatus("Sync Complete");
          setIsUploading(false);
          setProgress(100);
          setTimeout(() => {
            setProgress(0);
            setUploadStatus("");
          }, 2000);
          return downloadURL;
        } catch (error: any) {
          console.error("[STORAGE] Atomic Upload Failed:", error);
          throw error;
        }
      }

      const uploadTask = uploadBytesResumable(storageRef, dataToUpload);

      return new Promise((resolve, reject) => {
        // Increase timeout for resumable uploads
        const timeoutDuration = Math.max(120000, (file.size / 1024) * 20); 
        const timeout = setTimeout(() => {
          if (isUploading) {
            uploadTask.cancel();
            const err = new Error("Transmission Timed Out: High packet loss or storage offline.");
            handleUploadError(err);
            reject(err);
          }
        }, timeoutDuration);

        const handleUploadError = (error: any) => {
          clearTimeout(timeout);
          console.error("[STORAGE] Resumable Error:", error);
          
          setIsUploading(false);
          if (error.code === 'storage/unauthorized') {
            setError("Security Error: Storage rules blocking transmission.");
          } else if (error.code === 'storage/canceled') {
            setError("Transmission Terminated: Timeout or manual abort.");
          } else if (error.code === 'storage/retry-limit-exceeded') {
            setError("Sync Failure: Storage node unreachable. Check connectivity.");
          } else {
            setError(`Uplink Failed: ${error.message}`);
          }
          reject(error);
        };

        uploadTask.on('state_changed', 
          (snapshot) => {
            const uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 90;
            // Total progress = 10% (compression) + 90% (upload)
            setProgress(10 + uploadProgress);
            setUploadStatus(`Uplink: ${Math.round(uploadProgress)}%`);
          }, 
          handleUploadError, 
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`[STORAGE] Resumable upload success: ${downloadURL}`);
              clearTimeout(timeout);
              onUpload(downloadURL, type, file.name);
              setUploadStatus("Sync Complete");
              setIsUploading(false);
              setProgress(100);
              setTimeout(() => {
                setProgress(0);
                setUploadStatus("");
              }, 2000);
              resolve(downloadURL);
            } catch (err) {
              handleUploadError(err);
            }
          }
        );
      });
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || "Unknown protocol error during upload.");
      console.error("Critical Upload Error:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all duration-200",
          dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-gray-200 dark:border-zinc-800 hover:border-primary/50 bg-gray-50/50 dark:bg-zinc-950/50",
          isUploading && "pointer-events-none opacity-80",
          isSquare && "aspect-square max-w-[300px] mx-auto rounded-full"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept={allowedTypes.join(',')}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />

        {progress === 100 && !isUploading ? (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-green-500"
          >
            <CheckCircle2 className="w-12 h-12 mb-2" />
            <p className="text-sm font-black uppercase tracking-widest">Payload Synced</p>
          </motion.div>
        ) : isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-12 h-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">{Math.round(progress)}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 animate-pulse uppercase tracking-[0.2em] text-[10px] font-black">{uploadStatus || "Encrypting Transmissions..."}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">{label}</p>
            <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest opacity-60 italic">Cloud link: {maxSize}MB limit</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-[9px] text-red-500 font-bold uppercase tracking-widest max-w-[250px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
