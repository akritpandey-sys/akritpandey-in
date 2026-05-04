import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, Mail, MessageSquare } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp(),
        read: false
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({ name: '', email: '', subject: '', content: '' });
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg glass-card p-10 space-y-8"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-3xl font-black font-display tracking-tight uppercase italic">Transmit Signal</h3>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Direct link to Swaraj Intelligence.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl">
                <X />
              </button>
            </div>

            {success ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold uppercase">Transmission Confirmed</h4>
                <p className="text-xs text-gray-500 font-mono">Your signal has been encrypted and synced with our nodes.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Identify As</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        required type="text" placeholder="Name" 
                        value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 glass-card border-none bg-gray-50 dark:bg-zinc-950 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Reply Channel</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        required type="email" placeholder="Email"
                        value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 glass-card border-none bg-gray-50 dark:bg-zinc-950 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Signal Subject</label>
                  <input 
                    required type="text" placeholder="Subject"
                    value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 glass-card border-none bg-gray-50 dark:bg-zinc-950 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Intelligence Payload</label>
                  <textarea 
                    required rows={5} placeholder="Your message..."
                    value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full px-4 py-3 glass-card border-none bg-gray-50 dark:bg-zinc-950 text-sm resize-none"
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loading ? 'Encrypting...' : 'Initiate Transmission'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
