import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Application, UserProfile, Job } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MoreVertical, 
  Trash2, 
  Filter,
  Eye,
  Mail,
  User,
  Shield,
  Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ApplicationsDashboardProps {
  isAdmin: boolean;
}

export default function ApplicationsDashboard({ isAdmin }: ApplicationsDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    let q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    
    if (!isAdmin) {
      q = query(collection(db, 'applications'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
    }

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(docs);
      
      // Seed if empty and admin
      if (isAdmin && docs.length < 50) {
        const statuses: Application['status'][] = ['Pending', 'Reviewing', 'Interviewing', 'Accepted', 'Rejected'];
        const seedApps = Array.from({ length: 55 - docs.length }).map((_, i) => ({
          jobId: 'seed-job-' + i,
          jobTitle: ['Neural Engineer', 'Sovereignty Architect', 'Cyber Recon', 'Model Auditor', 'Edge Specialist'][i % 5],
          userId: 'seed-user-' + i,
          userName: `Candidate ${100 + i}`,
          userEmail: `agent.${100 + i}@swaraj.io`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          answers: { "Motivation": "Desire for sovereign intelligence autonomy." },
          resumeUrl: "https://example.com/cv.pdf",
          portfolioUrl: "https://example.com/portfolio",
          createdAt: new Date()
        }));

        seedApps.forEach(async (app) => {
          try {
            await addDoc(collection(db, 'applications'), {
              ...app,
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Application seeding failed", e);
          }
        });
      }

      const counts = docs.reduce((acc, app) => {
        acc.total++;
        if (app.status === 'Pending') acc.pending++;
        if (app.status === 'Accepted') acc.accepted++;
        if (app.status === 'Rejected') acc.rejected++;
        return acc;
      }, { total: 0, pending: 0, accepted: 0, rejected: 0 });
      
      setStats(counts);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'applications'));
    
    return unsub;
  }, [isAdmin]);

  const updateStatus = async (id: string, newStatus: Application['status']) => {
    try {
      await updateDoc(doc(db, 'applications', id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
    }
  };

  const filteredApplications = applications.filter(app => statusFilter === 'All' || app.status === statusFilter);

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl text-accent">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-4xl font-black font-display tracking-tight uppercase italic">Application <span className="text-gray-400">/ Registry</span></h2>
        </div>
        <p className="text-sm text-gray-500 font-mono tracking-wider ml-12">
          {isAdmin ? 'OVERWATCHING THE SOVEREIGN TALENT PIPELINE.' : 'TRACKING YOUR ASCENSION PROTOCOL STATUS.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Deployments', value: stats.total, color: 'text-primary', icon: FileText },
          { label: 'Pending Processing', value: stats.pending, color: 'text-orange-500', icon: Clock },
          { label: 'Authorized Agents', value: stats.accepted, color: 'text-green-500', icon: CheckCircle },
          { label: 'Terminated Links', value: stats.rejected, color: 'text-red-500', icon: XCircle },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 border-l-4" style={{ borderColor: i === 0 ? 'var(--color-primary)' : i === 1 ? '#f97316' : i === 2 ? '#22c55e' : '#ef4444' }}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <span className="text-[10px] font-black uppercase text-gray-400 font-mono">Realtime</span>
            </div>
            <h3 className="text-3xl font-black font-display tracking-tighter">{stat.value}</h3>
            <p className="text-[10px] font-bold uppercase text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-1 glass-card border-gray-200 dark:border-zinc-800 w-fit overflow-x-auto no-scrollbar">
        {['All', 'Pending', 'Reviewing', 'Interviewing', 'Accepted', 'Rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
              statusFilter === status ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Applications Table/List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-950/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Candidate / Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Position / Mission</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Deployment Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Protocol Payload</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app.id} className="border-b border-gray-100 dark:border-zinc-900 hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black uppercase truncate">{app.userName}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{app.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wide truncate">{app.jobTitle}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 font-mono italic">
                        {app.createdAt?.toDate ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'Active'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      app.status === 'Pending' && "bg-orange-500/10 text-orange-500 border-orange-500/20",
                      app.status === 'Accepted' && "bg-green-500/10 text-green-500 border-green-500/20",
                      app.status === 'Rejected' && "bg-red-500/10 text-red-500 border-red-500/20",
                      app.status === 'Reviewing' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                      app.status === 'Interviewing' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 font-mono">
                    <a 
                      href={app.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] text-primary hover:underline group-hover:scale-105 transition-transform"
                    >
                      <ExternalLink className="w-3 h-3" /> CREDENTIALS.PDF
                    </a>
                  </td>
                  <td className="px-6 py-6 text-right">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-2">
                        <select 
                          value={app.status || 'Pending'}
                          onChange={(e) => updateStatus(app.id, e.target.value as any)}
                          className="bg-transparent text-[10px] font-black uppercase text-primary border border-primary/20 rounded-lg p-1 outline-none hover:border-primary transition-all"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Reviewing">Reviewing</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Accepted">Accept</option>
                          <option value="Rejected">Reject</option>
                        </select>
                        <button 
                          onClick={async () => {
                            if(window.confirm('CRITICAL: Erase this application record? Operation irreversible.')) {
                              try {
                                await deleteDoc(doc(db, 'applications', app.id));
                                console.log(`Application ${app.id} purged.`);
                              } catch (e) {
                                handleFirestoreError(e, OperationType.DELETE, `applications/${app.id}`);
                              }
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button className="text-[9px] font-black uppercase text-primary hover:underline italic">
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <FileText className="w-12 h-12" />
                      <p className="text-xs font-black uppercase tracking-[0.3em]">No registry records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
