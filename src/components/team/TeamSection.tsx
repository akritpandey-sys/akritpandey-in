import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { TeamMember, Profile } from '../../types';
import { motion } from 'motion/react';
import { Users, Briefcase, Star, Mail, Plus, Trash2, ShieldCheck, Cpu, Edit2, Globe, MapPin, Baby, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import MemberModal from './MemberModal';

export default function TeamSection({ isAdmin }: { isAdmin: boolean }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [founderProfile, setFounderProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'profiles', 'main'), (snap) => {
      if (snap.exists()) setFounderProfile(snap.data() as Profile);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'profiles/main'));
    return unsubProfile;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'team'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
      setTeam(docs);
      
      if (docs.length === 0 && isAdmin) {
        // Seed team with an extensive and diverse representation for showcase
        const initial = [
          { name: "Akrit Pandey", role: "CEO & Founder", performance: "Elite", assignedProjects: ["Swaraj Identity OS", "Sovereign AI Core", "Global Intelligence Dashboard"], avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format" },
          { name: "Agent 0690", role: "AI Agent", performance: "Autonomous", assignedProjects: ["Autonomous Agent 0690", "Global Intelligence Dashboard"], avatarUrl: "https://images.unsplash.com/photo-1675249681218-42215f4ce81c?auto=format" },
          { name: "Sarah Chen", role: "Software Architect", performance: "High", assignedProjects: ["Quantum-Resistant Encryption", "Post-Sovereign Identity Layer"], avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format" },
          
          // Youth Division (Representative Boys)
          { name: "Aryan Sharma", role: "Frontend Developer (Youth Div)", performance: "High", assignedProjects: ["Swaraj Identity OS"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan" },
          { name: "Ishan Verma", role: "Backend Engineer (Youth Div)", performance: "Standard", assignedProjects: ["Post-Sovereign Identity Layer"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ishan" },
          { name: "Kabir Malhotra", role: "SecOps (Youth Div)", performance: "High", assignedProjects: ["Quantum-Resistant Encryption"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir" },
          
          // Youth Division (Representative Girls)
          { name: "Ananya Iyer", role: "UI Designer (Youth Div)", performance: "High", assignedProjects: ["Global Intelligence Dashboard"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya" },
          { name: "Diya Kapur", role: "Security Analyst (Youth Div)", performance: "High", assignedProjects: ["Swaraj Identity OS"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diya" },
          { name: "Myra Reddy", role: "Data Scientist (Youth Div)", performance: "Elite", assignedProjects: ["Autonomous Agent 0690"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Myra" },
          
          // International Nodes
          { name: "Hans Müller", role: "Node Lead (Germany)", performance: "Standard", assignedProjects: ["Decentralized Autonomous Hub"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hans" },
          { name: "Yuki Tanaka", role: "AI Researcher (Japan)", performance: "High", assignedProjects: ["Autonomous Agent 0690"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki" },
          { name: "Jordan Brooks", role: "Cloud Expert (USA)", performance: "Standard", assignedProjects: ["Sovereign AI Core"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" },
          { name: "Clara Dubois", role: "Cryptography (France)", performance: "High", assignedProjects: ["Quantum-Resistant Encryption"], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Clara" }
        ];
        initial.forEach(m => setDoc(doc(collection(db, 'team')), m).catch(e => handleFirestoreError(e, OperationType.WRITE, 'team')));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'team');
    });
    return unsub;
  }, [isAdmin]);

  const handleAddMember = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('CRITICAL: Terminate this personnel node? Access will be immediately revoked.')) return;
    try {
      await deleteDoc(doc(db, 'team', id));
      console.log(`Member ${id} purged from registry.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `team/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">Swaraj Personnel</h2>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Founders, Engineers & Autonomous Agents</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleAddMember}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-6 border-l-4 border-primary">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Workforce</p>
          </div>
          <h3 className="text-3xl font-black font-display">100+</h3>
          <p className="text-xs text-gray-400 mt-1">Sovereign Intelligence Agents & Personnel</p>
        </div>

        <div className="glass-card p-4 sm:p-6 border-l-4 border-accent col-span-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Youth Division (India)</p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black font-display">50</h3>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Under-18 Cognitive Agents</p>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <div className="flex-1 bg-blue-500/5 p-2 rounded-xl border border-blue-500/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[9px] sm:text-[10px] font-black text-blue-500 uppercase">27 Boys</span>
              </div>
              <p className="text-[8px] text-gray-400 mt-1 line-clamp-1">Aryan, Ishan, Kabir...</p>
            </div>
            <div className="flex-1 bg-pink-500/5 p-2 rounded-xl border border-pink-500/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                <span className="text-[9px] sm:text-[10px] font-black text-pink-500 uppercase">23 Girls</span>
              </div>
              <p className="text-[8px] text-gray-400 mt-1 line-clamp-1">Ananya, Diya, Myra...</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <Globe className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">International Nodes</p>
          </div>
          <h3 className="text-3xl font-black font-display">25+</h3>
          <p className="text-xs text-gray-400 mt-1">Direct recruitment from USA, China, Japan, Germany, France</p>
        </div>

        <div className="glass-card p-6 border-l-4 border-primary">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Lead Architects (India)</p>
          </div>
          <h3 className="text-3xl font-black font-display">25</h3>
          <p className="text-xs text-gray-400 mt-1">Senior Technical & Strategic Leads</p>
          <p className="text-[8px] text-gray-500 font-mono mt-2 italic">Operating from HQ India</p>
        </div>
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
                className="relative w-20 h-20 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-xl aspect-square" 
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
              {isAdmin && (
                <>
                  <Edit2 
                    className="w-4 h-4 text-gray-400 hover:text-primary cursor-pointer transition-colors" 
                    onClick={() => handleEditMember(member)}
                  />
                  <Trash2 
                    className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" 
                    onClick={() => handleDeleteMember(member.id)}
                  />
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <MemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        member={editingMember} 
      />
    </div>
  );
}
