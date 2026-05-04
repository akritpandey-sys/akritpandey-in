import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, query, collection, where, deleteDoc } from 'firebase/firestore';
import { Profile, UserProfile, Application } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  FileText, 
  Camera, 
  Save, 
  X, 
  CheckCircle, 
  ExternalLink,
  Shield,
  Briefcase,
  Bell,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import MediaUpload from '../ui/MediaUpload';

export default function UserProfileSection() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserProfile>>({});
  const [activeUpload, setActiveUpload] = useState<'profile' | 'resume' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        // Only initialize editedData if it's currently empty (first load)
        setEditedData(prev => Object.keys(prev).length === 0 ? data : prev);
      } else {
        // Init user profile
        const initial: Partial<UserProfile> = {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Sovereign Agent',
          email: auth.currentUser.email || '',
          photoUrl: auth.currentUser.photoURL || '',
          role: 'user',
          bio: '',
          skills: [],
          appliedJobs: []
        };
        setDoc(doc(db, 'users', auth.currentUser.uid), { ...initial, createdAt: serverTimestamp() });
        setUserProfile(initial as UserProfile);
        setEditedData(initial);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`));

    const q = query(collection(db, 'applications'), where('userId', '==', auth.currentUser.uid));
    const unsubApps = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'applications'));

    return () => {
      unsub();
      unsubApps();
    };
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser || !editedData) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ...editedData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleWithdrawApplication = async (id: string) => {
    if (!window.confirm('Withdraw this application? This record will be removed from the registry.')) return;
    try {
      await deleteDoc(doc(db, 'applications', id));
      console.log(`Application ${id} withdrawn.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `applications/${id}`);
    }
  };

  const handleUpload = async (url: string, type: 'image' | 'video' | 'file') => {
    if (!auth.currentUser) return;
    
    // field mapping for user requested names
    const field = activeUpload === 'profile' ? 'photoUrl' : 'resumeUrl';
    const altField = activeUpload === 'profile' ? 'profile_image' : null;
    
    try {
      setEditedData(prev => ({ 
        ...prev, 
        [field]: url,
        ...(altField ? { [altField]: url } : {})
      }));
      
      const payload: any = { 
        [field]: url,
        updatedAt: serverTimestamp() 
      };
      if (altField) payload[altField] = url;

      await setDoc(doc(db, 'users', auth.currentUser.uid), payload, { merge: true });
      
      setUserProfile(prev => prev ? { 
        ...prev, 
        [field]: url,
        ...(altField ? { [altField]: url } : {})
      } : null);
      
    } catch (e) {
      console.error("Profile update failed", e);
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setActiveUpload(null);
    }
  };

  const notifications = [
    { id: 1, title: "Identity OS Verification", body: "Your sovereign identity node has been verified on the Swaraj Mainnet.", type: "success", time: "2h ago" },
    { id: 2, title: "Mission Update", body: "Your application for 'Frontend Sovereignty Engineer' is under review.", type: "info", time: "5h ago" },
    { id: 3, title: "Security Alert", body: "New login detected from Mumbai, IN. Was this you?", type: "warning", time: "1d ago" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <User className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-xs font-black uppercase text-gray-400">Syncing Identity...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="glass-card overflow-hidden border-none rounded-[2rem]">
        <div className="h-40 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
        <div className="px-8 pb-8 -mt-16">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-zinc-950 bg-gray-100 dark:bg-zinc-900">
                <img 
                  src={editedData.photoUrl || userProfile?.photoUrl || `https://ui-avatars.com/api/?name=${userProfile?.name}`} 
                  className="w-full h-full object-cover" 
                  alt="Profile"
                />
                <button 
                  onClick={() => setActiveUpload('profile')}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[8px] font-black uppercase">Change Photo</span>
                </button>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left pb-2">
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight truncate max-w-xs">{userProfile?.name}</h2>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-xl hover:text-primary transition-all sm:shrink-0"
                >
                  {isEditing ? <X className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 font-mono italic mt-2 sm:mt-1 uppercase tracking-widest truncate">{userProfile?.email} • {userProfile?.role || 'Agent'}</p>
            </div>

            {isEditing && (
              <button 
                onClick={handleSave}
                className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            )}
          </div>
        </div>
      </div>      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <User className="w-3 h-3" /> Core Identity
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Display Name</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={editedData.name || ''}
                  onChange={e => setEditedData({...editedData, name: e.target.value})}
                  className="w-full p-4 glass-card border-white/5 focus:border-primary/50 text-sm disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Bio / Manifestos</label>
                <textarea 
                  rows={4}
                  disabled={!isEditing}
                  value={editedData.bio || ''}
                  onChange={e => setEditedData({...editedData, bio: e.target.value})}
                  className="w-full p-4 glass-card border-white/5 focus:border-primary/50 text-sm resize-none disabled:opacity-50"
                  placeholder="Share your sovereign vision..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black font-display flex items-center gap-2 px-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Applied Missions
            </h3>
            <div className="space-y-4">
              {applications.length > 0 ? applications.map(app => (
                <div key={app.id} className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-6 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight mb-1">{app.jobTitle}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Registry: {app.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      app.status === 'Pending' ? "bg-orange-500/10 text-orange-500" :
                      app.status === 'Accepted' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {app.status}
                    </span>
                    <button 
                      onClick={() => handleWithdrawApplication(app.id)}
                      className="text-[8px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors"
                    >
                      Withdraw
                    </button>
                    <p className="text-[8px] font-mono text-gray-400 mt-2 uppercase">Synced: {app.createdAt?.toDate ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'Pending'}</p>
                  </div>
                </div>
              )) : (
                <div className="glass-card p-12 text-center">
                  <p className="text-sm text-gray-500 italic">No mission records found in the node registry...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
              <Bell className="w-3 h-3" /> Intelligence Feed
            </h3>
            <div className="space-y-6">
              {notifications.map(n => (
                <div key={n.id} className="flex gap-4 group">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    n.type === 'success' ? "bg-green-500/10 text-green-500" :
                    n.type === 'warning' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="text-[10px] font-black uppercase group-hover:text-primary transition-colors truncate pr-2">{n.title}</h4>
                      <span className="text-[8px] font-mono text-gray-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Resumé Payload
            </h3>
            {userProfile?.resumeUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase truncate max-w-[100px]">CREDENTIALS.PDF</span>
                  </div>
                  <a href={userProfile.resumeUrl} target="_blank" className="p-2 hover:bg-accent/10 rounded-lg text-accent">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <button 
                  onClick={() => setActiveUpload('resume')}
                  className="w-full py-3 border border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-accent hover:text-accent transition-all"
                >
                  Update Payload
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 italic">No credentials detected in this node.</p>
                <button 
                  onClick={() => setActiveUpload('resume')}
                  className="w-full py-4 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-105 transition-all"
                >
                  Upload Resumé
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeUpload && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setActiveUpload(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass-card p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic">Upload {activeUpload}</h3>
                <button onClick={() => setActiveUpload(null)}><X /></button>
              </div>
              <MediaUpload 
                onUpload={handleUpload} 
                allowedTypes={activeUpload === 'profile' ? ['image/*'] : ['application/pdf', '.doc', '.docx']}
                isSquare={activeUpload === 'profile'}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
