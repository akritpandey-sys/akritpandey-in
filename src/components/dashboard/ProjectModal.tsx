import React, { useState } from 'react';
import { Project } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Image as ImageIcon, Film, FileText, Trash2, Plus, Calendar, User, Briefcase, DollarSign } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import MediaUpload from '../ui/MediaUpload';

interface ProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export default function ProjectModal({ project, isOpen, onClose, isAdmin }: ProjectModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const media = project.mediaUrls || [];

  const handleUpload = async (url: string, type: 'image' | 'video' | 'file', name: string) => {
    const newMedia = [...media, { url, type, name }];
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        mediaUrls: newMedia
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMedia = async (url: string) => {
    const newMedia = media.filter(m => m.url !== url);
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        mediaUrls: newMedia
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`DANGER: Terminate project "${project.name}"? This will expunge all linked media and records from the registry.`)) return;
    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'projects', project.id));
      console.log(`Project ${project.id} terminated.`);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${project.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] shadow-2xl"
          >
            <div className="p-6 sm:p-8 md:p-12 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start">
              <div className="space-y-2 min-w-0 pr-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest",
                  project.status === 'Active' ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-500"
                )}>
                  {project.status} UNIT
                </span>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-display tracking-tighter truncate">{project.name}</h2>
              </div>
              <div className="flex gap-2 shrink-0">
                {isAdmin && (
                  <button 
                    disabled={isUpdating}
                    onClick={handleDeleteProject} 
                    className="p-2 sm:p-3 bg-red-500/10 text-red-500 rounded-xl sm:rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 sm:p-3 bg-gray-100 dark:bg-zinc-800 rounded-xl sm:rounded-2xl hover:scale-110 transition-transform"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-12 space-y-8 sm:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Project Context</h4>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-light">{project.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-[8px] font-bold text-gray-500 uppercase">Value</p>
                        <p className="text-sm font-black">{formatCurrency(project.value)}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-[8px] font-bold text-gray-500 uppercase">Client</p>
                        <p className="text-sm font-black truncate max-w-[100px]">{project.client}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Media Assets & Archives</h4>
                  {isAdmin && (
                    <MediaUpload 
                      onUpload={handleUpload}
                      label="Attach Screenshot or Report"
                      className="mb-6"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {media.map((m, i) => (
                      <div key={i} className="group relative glass-card p-4 flex flex-col items-center justify-center text-center hover:border-primary transition-all overflow-hidden aspect-square">
                        {m.type === 'image' ? (
                          <img src={m.url} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" alt="" />
                        ) : null}
                        
                        <div className="relative z-10 flex flex-col items-center">
                          {m.type === 'image' ? <ImageIcon className="w-8 h-8 text-primary mb-2" /> : m.type === 'video' ? <Film className="w-8 h-8 text-primary mb-2" /> : <FileText className="w-8 h-8 text-primary mb-2" />}
                          <p className="text-[10px] font-bold truncate max-w-[120px]">{m.name}</p>
                          <a href={m.url} target="_blank" className="mt-3 text-[8px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                            VIEW ASSET <ExternalLink size={8} />
                          </a>
                        </div>

                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteMedia(m.url)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    {media.length === 0 && (
                      <div className="col-span-2 py-10 text-center bg-gray-50 dark:bg-zinc-950 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-900 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                        No Assets Attached
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
