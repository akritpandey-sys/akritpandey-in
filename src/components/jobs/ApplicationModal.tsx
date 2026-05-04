import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Job, Application } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, FileText, CheckCircle2, Loader2, User } from 'lucide-react';
import MediaUpload from '../ui/MediaUpload';
import { cn } from '../../lib/utils';

interface ApplicationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplicationModal({ job, isOpen, onClose, onSuccess }: ApplicationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    resumeUrl: '',
    answers: {} as Record<string, string>
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setFormData(prev => ({
        ...prev,
        name: auth.currentUser?.displayName || '',
        email: auth.currentUser?.email || ''
      }));

      // Fetch existing profile to get resume if it exists
      const profileRef = doc(db, 'users', auth.currentUser.uid);
      getDocs(query(collection(db, 'users'), where('id', '==', auth.currentUser.uid))).then(snap => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          if (data.resumeUrl) setFormData(prev => ({ ...prev, resumeUrl: data.resumeUrl }));
        }
      });
    }
  }, [auth.currentUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Unauthorized terminal session. Please bridge your identity first.");
      return;
    }
    if (!formData.resumeUrl) {
      alert("Resume payload missing. Please upload your credentials.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const application: Partial<Application> = {
        jobId: job?.id,
        jobTitle: job?.title,
        userId: auth.currentUser.uid,
        userName: formData.name,
        userEmail: formData.email,
        resumeUrl: formData.resumeUrl,
        status: 'Pending',
        answers: formData.answers,
      };

      await addDoc(collection(db, 'applications'), {
        ...application,
        createdAt: serverTimestamp()
      });

      // Update user profile with resume if not exists or different
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        id: auth.currentUser.uid,
        name: formData.name,
        email: formData.email,
        resumeUrl: formData.resumeUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 2500);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'applications');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && job && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl glass-card overflow-hidden shadow-2xl border-primary/20"
          >
            {isSuccess ? (
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-3xl font-black font-display uppercase tracking-tight italic">Transmission Confirmed</h3>
                <p className="text-gray-400 font-mono text-sm">Your sovereign credentials have been deployed to the {job.title} board.</p>
              </div>
            ) : (
              <>
                <div className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border-b border-white/5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Initiating Deployment</p>
                      <h3 className="text-2xl font-black font-display uppercase tracking-tight">{job.title}</h3>
                      <p className="text-xs text-gray-400 font-mono italic">{job.location} • {job.type}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          required 
                          type="text" 
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 glass-card border-white/5 focus:border-primary/50 text-sm"
                          placeholder="Your identity name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400">Secure Email</label>
                      <input 
                        required 
                        disabled
                        type="email" 
                        value={formData.email || ''}
                        className="w-full p-3 glass-card border-white/5 opacity-50 cursor-not-allowed text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400">Credential Payload (Resume PDF)</label>
                    <MediaUpload 
                      onUpload={(url) => setFormData({ ...formData, resumeUrl: url })}
                      allowedTypes={['application/pdf', '.doc', '.docx']}
                      label="Upload credentials"
                    />
                    {formData.resumeUrl && (
                      <div className="flex items-center gap-3 p-4 glass-card bg-primary/5 border-primary/20">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase text-primary">Payload Synced</p>
                          <p className="text-xs text-gray-400 truncate opacity-60">{formData.resumeUrl}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, resumeUrl: '' })}
                          className="p-1 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {job.questions && job.questions.length > 0 && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400">Screening Intelligence</label>
                      {job.questions.map((q, i) => (
                        <div key={i} className="space-y-2">
                          <p className="text-xs font-bold text-gray-300">{q}</p>
                          <textarea 
                            required
                            rows={3}
                            value={formData.answers[q] || ''}
                            onChange={e => setFormData({ 
                              ...formData, 
                              answers: { ...formData.answers, [q]: e.target.value } 
                            })}
                            className="w-full p-4 glass-card border-white/5 focus:border-primary/50 text-sm resize-none"
                            placeholder="Provide your rationale..."
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-6">
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !formData.resumeUrl}
                      className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Transmitting...
                        </>
                      ) : (
                        <>
                          Deploy Application <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[8px] text-gray-500 mt-4 tracking-widest font-mono">ENCRYPTED END-TO-END VIA SWARAJ PROTOCOL</p>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
