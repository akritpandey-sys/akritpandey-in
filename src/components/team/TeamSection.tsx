import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { TeamMember, Profile } from '../../types';
import { motion } from 'motion/react';
import { Users, Briefcase, Star, Mail, Plus, Trash2, ShieldCheck, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TeamSection({ isAdmin }: { isAdmin: boolean }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [founderProfile, setFounderProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'profiles', 'main'), (snap) => {
      if (snap.exists()) setFounderProfile(snap.data() as Profile);
    });
    return unsubProfile;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'team'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
      setTeam(docs);
      
      if (docs.length === 0 && isAdmin) {
        // Seed team
        const initial = [
          { name: "Akrit Pandey", role: "CEO & Founder", performance: "Elite", assignedProjects: ["Swaraj OS", "Agent 0690"], avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=100&h=100&auto=format&fit=crop" },
          { name: "Agent 0690", role: "Sovereign AI Intelligence", performance: "Autonomous", assignedProjects: ["Global Scanning"], avatarUrl: "https://images.unsplash.com/photo-1675249681218-42215f4ce81c?q=80&w=100&h=100&auto=format&fit=crop" },
          { name: "Sarah Chen", role: "Head of Project Architecture", performance: "High", assignedProjects: ["Client X Redesign"], avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop" }
        ];
        initial.forEach(m => setDoc(doc(collection(db, 'team')), m).catch(e => handleFirestoreError(e, OperationType.WRITE, 'team')));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'team');
    });
    return unsub;
  }, [isAdmin]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black font-display tracking-tight">Swaraj Personnel</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Founders, Engineers & Autonomous Agents</p>
        </div>
        {isAdmin && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((member, i) => (
          <motion.div 
            key={member.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col items-center text-center group hover:neo-glow transition-all duration-300"
          >
            <div className="relative mb-4">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary to-accent rounded-full opacity-20 group-hover:opacity-40 blur transition-opacity" />
              <img 
                src={(member.name === 'Akrit Pandey' && founderProfile?.photoUrl) ? founderProfile.photoUrl : member.avatarUrl} 
                alt={member.name} 
                className="relative w-20 h-20 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-xl" 
              />
              {member.role.includes('AI') && (
                <div className="absolute -right-1 -bottom-1 p-1 bg-black text-primary rounded-full border border-primary/50 shadow-lg">
                  <Cpu className="w-4 h-4" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold font-display">{member.name}</h3>
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-4">{member.role}</p>
            
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Performance</span>
                  <span className="text-xs font-black text-green-500 uppercase tracking-tight">{member.performance}</span>
                </div>
                <Star className="w-4 h-4 text-accent fill-accent" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">Active Engagements</p>
                <div className="flex flex-wrap gap-2">
                  {member.assignedProjects?.map(project => (
                    <span key={project} className="px-2 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold">
                      {project}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 w-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Mail className="w-4 h-4 text-gray-400 hover:text-primary cursor-pointer" />
              <Briefcase className="w-4 h-4 text-gray-400 hover:text-primary cursor-pointer" />
              {isAdmin && <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
