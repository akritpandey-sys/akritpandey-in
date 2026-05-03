import React, { useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, query, getDocs } from 'firebase/firestore';
import Layout from './components/layout/Shell';
import ProfileSection from './components/profile/ProfileSection';
import NewsSection from './components/news/NewsSection';
import WikiSection from './components/wiki/WikiSection';
import CompanyDashboard from './components/dashboard/CompanyDashboard';
import TeamSection from './components/team/TeamSection';
import { motion, AnimatePresence } from 'motion/react';

// Seed initial data if empty
async function seedInitialData(isAdmin: boolean) {
  if (!isAdmin) return;
  
  const projectsRef = collection(db, 'projects');
  const projectsSnap = await getDocs(projectsRef);
  if (projectsSnap.empty) {
    const initialProjects = [
      { name: "Swaraj Identity OS", description: "Sovereign digital identity system based on decentralization.", client: "Swaraj Digital", value: 12000000, status: 'Active' },
      { name: "E-Commerce Blockchain Integration", description: "Securing supply chains with custom blockchain protocols.", client: "Global Logistics", value: 4500000, status: 'Completed' },
      { name: "Autonomous Agent 0690", description: "Next-gen AI agent for corporate intelligence scanning.", client: "Confidential", value: 8000000, status: 'Active' },
    ];
    initialProjects.forEach(p => setDoc(doc(projectsRef), p));
  }

  const financeRef = collection(db, 'finance');
  const financeSnap = await getDocs(financeRef);
  if (financeSnap.empty) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    months.forEach((m, i) => {
      setDoc(doc(financeRef), {
        month: m,
        revenue: 1000000 + i * 200000,
        expenses: 600000 + i * 50000,
        profit: (1000000 + i * 200000) - (600000 + i * 50000)
      });
    });
  }

  const wikiRef = collection(db, 'wiki');
  const wikiSnap = await getDocs(wikiRef);
  if (wikiSnap.empty) {
    const pages = [
      { 
        id: 'about-akrit', 
        slug: 'about-akrit', 
        title: 'Akrit Pandey', 
        content: '# Akrit Pandey\n\nFounder and CEO of **Swaraj Digital Sovereignty**. A visionary architect focused on creating digital identity systems and autonomous intelligence layers.\n\n## Vision\n"Digital sovereignty is the fundamental right of every individual in the 21st century."\n\n## Core Focus\n- Decentralized systems\n- AI Intelligence OS\n- Sovereign product architecture' 
      },
      { 
        id: 'agent-0690', 
        slug: 'agent-0690', 
        title: 'Agent 0690 Intelligence', 
        content: '# Agent 0690\n\nThe primary autonomous intelligence layer of the Swaraj ecosystem.\n\n### Capabilities\n1. **Corporate Scanning**: Real-time market intelligence gathering.\n2. **Sentiment Analysis**: Understanding global sentiment shifts.\n3. **Risk Mitigation**: Predicting financial shifts before they occur.' 
      }
    ];
    pages.forEach(p => setDoc(doc(wikiRef, p.id), p));
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const admin = user?.email === 'shivashp77059@gmail.com';
      setIsAdmin(admin);
      if (admin) {
        seedInitialData(true);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSection isAdmin={isAdmin} />;
      case 'news': return <NewsSection isAdmin={isAdmin} />;
      case 'wiki': return <WikiSection isAdmin={isAdmin} />;
      case 'dashboard': return <CompanyDashboard isAdmin={isAdmin} />;
      case 'team': return <TeamSection isAdmin={isAdmin} />;
      default: return <ProfileSection isAdmin={isAdmin} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary blur-xl opacity-50 animate-pulse rounded-full" />
          </div>
        </motion.div>
        <p className="mt-8 text-primary font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Initializing Sovereign OS...</p>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
