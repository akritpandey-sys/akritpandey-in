import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, setDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Job, Application } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import MediaUpload from '../ui/MediaUpload';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import ApplicationModal from './ApplicationModal';

interface JobSectionProps {
  isAdmin: boolean;
}

export default function JobSection({ isAdmin }: JobSectionProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyingFor, setApplyingFor] = useState<Job | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'jobs'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(docs);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'jobs'));
    return unsub;
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      const q = query(collection(db, 'applications'), where('userId', '==', auth.currentUser.uid));
      getDocs(q).then(snap => {
        setAppliedJobIds(snap.docs.map(doc => doc.data().jobId));
      });
    }
  }, [auth.currentUser]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('CRITICAL: Terminate this position listing? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'jobs', id));
      console.log(`Job ${id} terminated successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `jobs/${id}`);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || job.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl text-primary shrink-0">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight uppercase italic truncate">Operations <span className="text-gray-400">/ Board</span></h2>
          </div>
          <p className="text-[10px] sm:text-sm text-gray-500 font-mono tracking-wider ml-10 sm:ml-12 uppercase">Recruiting Sovereign Agents</p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => { setSelectedJob(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Deploy Listing
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="relative group sm:col-span-1 md:col-span-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Scan positions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 glass-card border-gray-200 dark:border-zinc-800 focus:border-primary/50 text-sm focus:ring-0 transition-all rounded-xl sm:rounded-2xl"
          />
        </div>

        <div className="flex gap-2 p-1 glass-card border-gray-200 dark:border-zinc-800 overflow-x-auto no-scrollbar sm:col-span-1 md:col-span-2 rounded-xl sm:rounded-2xl">
          {['All', 'Full-time', 'Contract', 'Internship'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                typeFilter === type ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <motion.div 
            layout
            key={job.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group glass-card overflow-hidden hover:border-primary/50 transition-all duration-500"
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                      job.status === 'Open' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      • {job.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black font-display tracking-tight group-hover:text-primary transition-colors">{job.title}</h3>
                  {job.image && (
                    <div className="mt-4 h-32 w-full rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                      <img src={job.image} className="w-full h-full object-cover" alt="Job preview" />
                    </div>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 font-mono">
                  <MapPin className="w-3 h-3 text-primary" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 font-mono">
                  <DollarSign className="w-3 h-3 text-accent" /> {job.salary || 'Sovereign Pay'}
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 font-mono">
                  <Clock className="w-3 h-3 text-orange-500" /> 
                  {job.createdAt?.toDate ? new Date(job.createdAt.toDate()).toLocaleDateString() : 'Active'}
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 line-clamp-2">{job.description}</p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black text-gray-400">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                    +12
                  </div>
                </div>

                {appliedJobIds.includes(job.id) ? (
                  <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> APPLIED
                  </div>
                ) : (
                  <button 
                    disabled={job.status === 'Closed'}
                    onClick={() => { setApplyingFor(job); setIsApplyModalOpen(true); }}
                    className="flex items-center gap-2 py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] sm:text-xs font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all disabled:opacity-50"
                  >
                    Initiate <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-2xl glass-card p-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black font-display uppercase italic">{selectedJob ? 'Update' : 'Deploy'} Protocol</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <JobForm 
                initialData={selectedJob} 
                onSubmit={() => setIsModalOpen(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile/Apply Modal */}
      <ApplicationModal 
        job={applyingFor} 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        onSuccess={() => {
          if(applyingFor) setAppliedJobIds([...appliedJobIds, applyingFor.id]);
          setIsApplyModalOpen(false);
        }}
      />
    </div>
  );
}

function JobForm({ initialData, onSubmit }: { initialData?: Job | null, onSubmit: () => void }) {
  const [formData, setFormData] = useState<Partial<Job>>(initialData || {
    title: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: [],
    salary: '',
    status: 'Open',
    questions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await setDoc(doc(db, 'jobs', initialData.id), { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await addDoc(collection(db, 'jobs'), { ...formData, createdAt: serverTimestamp() });
      }
      onSubmit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'jobs');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Position Title</label>
          <input 
            required 
            type="text" 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-4 glass-card border-gray-200 dark:border-zinc-800 focus:border-primary/50 text-sm" 
            placeholder="e.g. Sovereign AI Architect"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Location / Realm</label>
          <input 
            required 
            type="text" 
            value={formData.location} 
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            className="w-full p-4 glass-card border-gray-200 dark:border-zinc-800 focus:border-primary/50 text-sm" 
            placeholder="e.g. Remote / Metaverse"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Engagement Type</label>
          <select 
            value={formData.type} 
            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full p-4 glass-card border-gray-200 dark:border-zinc-800 focus:border-primary/50 text-sm appearance-none"
          >
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Salary Range</label>
          <input 
            type="text" 
            value={formData.salary} 
            onChange={e => setFormData({ ...formData, salary: e.target.value })}
            className="w-full p-4 glass-card border-gray-200 dark:border-zinc-800 focus:border-primary/50 text-sm" 
            placeholder="e.g. $120k - $160k"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-gray-400">Position Visual (Optional)</label>
        <MediaUpload 
          onUpload={(url) => setFormData({ ...formData, image: url })}
          label="Agency Background Image"
          allowedTypes={['image/*']}
        />
        {formData.image && (
          <div className="relative mt-2 h-32 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 group">
            <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
            <button 
              type="button" 
              onClick={() => setFormData({ ...formData, image: '' })}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-gray-400">Mission Description</label>
        <textarea 
          required 
          rows={5}
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-4 glass-card border-gray-200 dark:border-zinc-800 focus:border-primary/50 text-sm resize-none" 
          placeholder="Detailed description of the role and agency goals..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-gray-400">Mandatory Requirements (One per line)</label>
        <textarea 
          rows={3}
          value={formData.requirements?.join('\n')} 
          onChange={e => setFormData({ ...formData, requirements: e.target.value.split('\n').filter(r => r.trim()) })}
          className="w-full p-4 glass-card border-gray-200 dark:border-zinc-800 focus:border-primary/50 text-sm font-mono" 
          placeholder="Technical mastery in ZKP..."
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Syncing...' : initialData ? 'Update Transmission' : 'Deploy Listing'}
        </button>
      </div>
    </form>
  );
}
