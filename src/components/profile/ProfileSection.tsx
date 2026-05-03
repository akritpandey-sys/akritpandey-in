import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { Profile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Save, X, Github, Linkedin, Twitter, Globe, Briefcase, Award, TrendingUp, Users, CheckCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import MediaUpload from '../ui/MediaUpload';

export default function ProfileSection({ isAdmin }: { isAdmin: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [activeUpload, setActiveUpload] = useState<'profile' | 'banner' | null>(null);
  const [liveStats, setLiveStats] = useState({ active: 0, completed: 0, teamSize: 0 });

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const active = snap.docs.filter(d => d.data().status === 'Active').length;
      const completed = snap.docs.filter(d => d.data().status === 'Completed').length;
      setLiveStats(prev => ({ ...prev, active, completed }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'projects'));

    const unsubTeam = onSnapshot(collection(db, 'team'), (snap) => {
      setLiveStats(prev => ({ ...prev, teamSize: snap.docs.length }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'team'));

    return () => {
      unsubProjects();
      unsubTeam();
    };
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'profiles', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        setProfile(data);
        if (!isEditing) {
          setEditedProfile(data);
        }
      } else if (isAdmin) {
        // Initial setup if document doesn't exist
        const initial: Profile = {
          name: "Akrit Pandey",
          role: "Founder & CEO – Swaraj Digital Sovereignty",
          bio: "Building the next generation of digital sovereignty. Architecting digital identity ecosystems and Founder-AI integration systems.",
          photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&h=600&auto=format&fit=crop",
          bannerUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1200&h=400&auto=format&fit=crop",
          skills: ["Digital Strategy", "AI Integration", "Product Architecture", "Sovereign Tech"],
          socialLinks: { twitter: "https://twitter.com", linkedin: "https://linkedin.com", github: "https://github.com" },
          achievements: ["Founded Swaraj DS", "Scale 10+ AI Projects", "Pioneered OS-Identity Hybrid"],
          stats: {
            projectsCompleted: 8,
            activeProjects: 3,
            companyValuation: 25000000,
            teamSize: 12
          }
        };
        setDoc(docRef, initial).catch(err => handleFirestoreError(err, OperationType.WRITE, 'profiles/main'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'profiles/main');
    });

    return () => unsubscribe();
  }, [isAdmin, isEditing]);

  const handleSave = async () => {
    if (editedProfile) {
      try {
        await setDoc(doc(db, 'profiles', 'main'), editedProfile);
        setIsEditing(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'profiles/main');
      }
    }
  };

  const handleMediaUpload = async (url: string) => {
    if (!profile) return;
    
    // Create new data
    const updatedData = { 
      ...(editedProfile || profile), 
      [activeUpload === 'profile' ? 'photoUrl' : 'bannerUrl']: url 
    };

    setEditedProfile(updatedData);
    
    // If not in full edit mode, save immediately to sync globally
    if (!isEditing) {
      try {
        await setDoc(doc(db, 'profiles', 'main'), updatedData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'profiles/main');
      }
    }
    
    setActiveUpload(null);
  };

  if (!profile) return <div className="animate-pulse">Loading Profile...</div>;

  return (
    <div className="space-y-8">
      {/* Banner & Hero Container */}
      <div className="relative glass-card overflow-hidden border-none rounded-[2rem]">
        {/* Banner */}
        <div className="relative h-48 md:h-64 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
          <img 
            src={editedProfile?.bannerUrl || profile.bannerUrl} 
            alt="Banner" 
            className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
          />
          {isAdmin && isEditing && (
            <button 
              onClick={() => setActiveUpload('banner')}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-xl backdrop-blur-md border border-white/20 hover:bg-black/70 transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <Camera className="w-4 h-4" /> Change Banner
            </button>
          )}
        </div>

        <div className="px-6 md:px-12 pb-12 -mt-12 md:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            {/* Profile Picture */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="relative group shrink-0"
            >
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-[6px] border-white dark:border-black shadow-2xl aspect-square bg-zinc-200 dark:bg-zinc-800">
                <img 
                  id="profile-picture"
                  src={editedProfile?.photoUrl || profile.photoUrl} 
                  alt={profile.name} 
                  className="w-full h-full object-cover rounded-full"
                />
                {isAdmin && isEditing && (
                  <button 
                    onClick={() => setActiveUpload('profile')}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Update Photo</span>
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Simple Info */}
            <div className="flex-1 text-center md:text-left pb-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h2 className="text-4xl md:text-6xl font-black font-display tracking-tighter">{profile.name}</h2>
                {isAdmin && !isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all hover:scale-110 shadow-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                <p className="px-3 py-1 bg-primary/10 text-primary font-bold tracking-widest text-[10px] uppercase rounded-full border border-primary/20">{profile.role}</p>
                <div className="flex items-center gap-3">
                  <a href={profile.socialLinks.twitter} className="text-gray-400 hover:text-primary transition-colors"><Twitter className="w-4 h-4" /></a>
                  <a href={profile.socialLinks.linkedin} className="text-gray-400 hover:text-primary transition-colors"><Linkedin className="w-4 h-4" /></a>
                  <a href={profile.socialLinks.github} className="text-gray-400 hover:text-primary transition-colors"><Github className="w-4 h-4" /></a>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pb-6">
                <button 
                  onClick={handleSave} 
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  <Save className="w-4 h-4" /> DEPLOY UPDATES
                </button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="px-8 py-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-sm font-bold border border-transparent hover:border-zinc-700 transition-all"
                >
                  ABORT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Bio Section */}
          <div className="glass-card p-8 md:p-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Founder Intelligence</h3>
            {!isEditing ? (
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                {profile.bio}
              </p>
            ) : (
              <textarea 
                value={editedProfile?.bio}
                onChange={(e) => setEditedProfile({ ...editedProfile!, bio: e.target.value })}
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 focus:ring-2 focus:ring-primary outline-none text-lg min-h-[200px]"
                placeholder="Write your manifesto..."
              />
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Completed', value: liveStats.completed, icon: CheckCircle },
              { label: 'Active', value: liveStats.active, icon: Briefcase },
              { label: 'Valuation', value: `₹${(profile.stats.companyValuation / 10000000).toFixed(1)}Cr`, icon: TrendingUp },
              { label: 'Team', value: liveStats.teamSize, icon: Users },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:neo-glow transition-all duration-300"
              >
                <stat.icon className="w-5 h-5 text-primary mb-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                <p className="text-2xl font-black font-display">{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Intelligence Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-xl text-[10px] font-black tracking-widest uppercase shadow-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Sovereign Milestones
            </h3>
            <ul className="space-y-4">
              {profile.achievements.map((item, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary transition-colors">
                    <CheckCircle className="w-3 h-3 text-primary group-hover:text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {activeUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setActiveUpload(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-card p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black font-display">
                  Upload {activeUpload === 'profile' ? 'Profile Photo' : 'Banner Image'}
                </h3>
                <button onClick={() => setActiveUpload(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X />
                </button>
              </div>
              
              <MediaUpload 
                onUpload={(url) => handleMediaUpload(url)}
                allowedTypes={['image/*']}
                label={`Select ${activeUpload} image`}
              />
              
              <p className="text-xs text-center text-gray-500 font-medium">
                Max size 5MB. JPEGs, PNGs, and GIFs supported.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
