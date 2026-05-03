import React, { useState, useRef } from 'react';
import { storage, auth } from '../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Upload, X, File, Image as ImageIcon, Film, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MediaUploadProps {
  onUpload: (url: string, type: 'image' | 'video' | 'file', name: string) => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
  label?: string;
}

export default function MediaUpload({ 
  onUpload, 
  allowedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx'], 
  maxSize = 20,
  className,
  label = "Upload Media"
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      throw new Error(`File size must be under ${maxSize}MB.`);
    }
  };

  const compressImage = async (file: File): Promise<Blob | File> => {
    if (!file.type.startsWith('image/')) return file;
    
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;

      // Max width/height for compression
      const MAX_SIZE = 1200;
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = (height / width) * MAX_SIZE;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = (width / height) * MAX_SIZE;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(bitmap, 0, 0, width, height);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, "image/jpeg", 0.8);
      });
    } catch (err) {
      console.warn("Compression failed, using original file:", err);
      return file;
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setProgress(5);
    setError(null);

    try {
      validateFile(file);
      const processedFile = await compressImage(file);
      
      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'file';
      
      const storageRef = ref(storage, `media/${auth.currentUser?.uid || 'public'}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, processedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.max(5, p));
        }, 
        (err: any) => {
          console.error("Upload error details:", err);
          if (err.code === 'storage/unauthorized') {
            setError("Access Denied. Check Storage Rules.");
          } else if (err.code === 'storage/retry-limit-exceeded') {
            setError("Connection timed out. Please try a smaller file or better network.");
          } else {
            setError(`Upload failed: ${err.message}`);
          }
          setIsUploading(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onUpload(downloadURL, type, file.name);
            setIsUploading(false);
            setProgress(100);
            setTimeout(() => setProgress(0), 1000);
          } catch (err) {
            setError("Failed to get download link.");
            setIsUploading(false);
          }
        }
      );
    } catch (err: any) {
      setError(err.message || "Upload failed.");
      setIsUploading(false);
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
          "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-200",
          dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-gray-200 dark:border-zinc-800 hover:border-primary/50 bg-gray-50/50 dark:bg-zinc-950/50",
          isUploading && "pointer-events-none opacity-80"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept={allowedTypes.join(',')}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-12 h-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">{Math.round(progress)}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 animate-pulse">Uploading to Swaraj Cloud...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</p>
            <p className="text-xs text-gray-400 mt-1">Drag & Drop or Click to select</p>
          </>
        )}

        {error && (
          <p className="text-xs text-red-500 mt-4 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
