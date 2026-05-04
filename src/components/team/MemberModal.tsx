import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { TeamMember } from '../../types';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MediaUpload from '../ui/MediaUpload';
import { cn } from '../../lib/utils';

interface MemberModalProps {
  member: Partial<TeamMember> | null;
  isOpen: boolean;
  onClose: () => void;
}

const PREDEFINED_ROLES = ['Developer', 'Designer', 'Manager', 'AI Agent', 'Analyst'];
const AVAILABLE_PROJECTS = [
  'Swaraj Identity OS',
  'Autonomous Agent 0690',
  'Quantum-Resistant Encryption',
  'Global Intelligence Dashboard',
  'Sovereign AI Core',
  'Decentralized Autonomous Hub',
  'Post-Sovereign Identity Layer'
];

export default function MemberModal({ member, isOpen, onClose }: MemberModalProps) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    role: 'Developer',
    performance: 'High',
    avatarUrl: '',
    assignedProjects: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        ...member,
        assignedProjects: member.assignedProjects || []
      });
    } else {
      setFormData({
        name: '',
        role: 'Developer',
        performance: 'High',
        avatarUrl: '',
        assignedProjects: []
      });
    }
  }, [member]);

  const toggleProject = (project: string) => {
    setFormData(prev => {
      const current = prev.assignedProjects || [];
      if (current.includes(project)) {
        return { ...prev, assignedProjects: current.filter(p => p !== project) };
      }
      return { ...prev, assignedProjects: [...current, project] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (member?.id) {
        await updateDoc(doc(db, 'team', member.id), formData);
      } else {
        const newMemberRef = doc(db, 'team', Date.now().toString());
        await setDoc(newMemberRef, {
          ...formData,
          id: newMemberRef.id
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!member?.id) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'team', member.id));
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'team');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={onClose} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl glass-card p-8 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black font-display tracking-tight">
                  {member?.id ? 'Edit Personnel' : 'Recruit Personnel'}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Specialization / Role</label>
                    <select 
                      value={formData.role || ''}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                    >
                      {PREDEFINED_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      {/* Allow custom if currently exists but not in list (for legacy) */}
                      {formData.role && !PREDEFINED_ROLES.includes(formData.role) && (
                        <option value={formData.role}>{formData.role}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Performance Tier</label>
                    <select 
                      value={formData.performance || ''}
                      onChange={e => setFormData({ ...formData, performance: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Elite">Elite</option>
                      <option value="High">High</option>
                      <option value="Standard">Standard</option>
                      <option value="Autonomous">Autonomous</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Assigned Missions / Projects</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_PROJECTS.map(project => (
                      <button
                        key={project}
                        type="button"
                        onClick={() => toggleProject(project)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          formData.assignedProjects?.includes(project)
                            ? "bg-primary text-white border-primary"
                            : "bg-gray-50 dark:bg-zinc-900 text-gray-500 border-gray-200 dark:border-zinc-800 hover:border-primary/50"
                        )}
                      >
                        {project}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Personnel Photo</label>
                  <MediaUpload 
                    onUpload={(url) => setFormData({ ...formData, avatarUrl: url })}
                    label="Upload Photo"
                    allowedTypes={['image/*']}
                    isSquare={true}
                  />
                  {formData.avatarUrl && (
                    <div className="mt-4 flex items-center gap-4 p-4 glass-card">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                        <img src={formData.avatarUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-gray-400">Preview (Square Cropped)</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{formData.avatarUrl}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 sticky bottom-0 bg-inherit md:relative">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : member?.id ? 'Override Data' : 'Authorize Recruitment'}
                  </button>
                  {member?.id && (
                    <button 
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
