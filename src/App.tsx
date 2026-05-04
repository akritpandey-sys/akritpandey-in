import React, { useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Layout from './components/layout/Shell';
import ProfileSection from './components/profile/ProfileSection';
import NewsSection from './components/news/NewsSection';
import WikiSection from './components/wiki/WikiSection';
import CompanyDashboard from './components/dashboard/CompanyDashboard';
import TeamSection from './components/team/TeamSection';
import JobSection from './components/jobs/JobSection';
import ApplicationsDashboard from './components/dashboard/ApplicationsDashboard';
import CrmSection from './components/crm/CrmSection';
import UserProfileSection from './components/profile/UserProfileSection';
import HomeSection from './components/home/HomeSection';
import { motion, AnimatePresence } from 'motion/react';
import { getDoc, limit } from 'firebase/firestore';

// Seed initial data if empty
async function seedInitialData(isAdmin: boolean) {
  if (!isAdmin) return;

  // Profiles (Founder)
  const profileDoc = await getDoc(doc(db, 'profiles', 'main'));
  if (!profileDoc.exists()) {
    await setDoc(doc(db, 'profiles', 'main'), {
      name: "Shivashraya Pandey",
      role: "Lead Architect & Sovereign Founder",
      bio: "Engineering the next generation of digital sovereignty. Specialist in decentralized systems and zero-trust AI infrastructure.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      location: "Bharat (India)",
      email: "shivashp77059@gmail.com",
      github: "https://github.com/swaraj",
      linkedin: "https://linkedin.com/in/shivashp77059",
      twitter: "https://twitter.com/swaraj_global",
      stats: { projects: 42, commits: 1240, nodes: 15 },
      expertise: ["Systems Arch", "AI Safety", "Cryptography"],
      awards: ["Global Tech Sovereign 2025", "Infrastructure Pioneer"]
    });
  }
  
  const projectsRef = collection(db, 'projects');
  const projectsSnap = await getDocs(projectsRef);
  if (projectsSnap.empty) {
    const initialProjects = [
      { name: "Swaraj Identity OS", description: "Sovereign digital identity system based on decentralization and zero-knowledge proofs.", client: "Swaraj Foundation", value: 12000000, status: 'Active' },
      { name: "E-Commerce Blockchain Security", description: "Securing national supply chains with custom immutable ledger protocols.", client: "Bharat Logistics", value: 4500000, status: 'Completed' },
      { name: "Autonomous Agent 0690 Core", description: "Primary AI node for corporate intelligence and risk mitigation.", client: "Confidential", value: 8000000, status: 'Active' },
      { name: "Pillar of Sovereignty", description: "Infrastructure project to establish 50 independent data centers.", client: "Global Infra", value: 25000000, status: 'Active' },
      { name: "Neural Safety Audit", description: "Stress testing enterprise LLMs for prompt injection and safety alignment.", client: "Tech Giant Inc.", value: 1200000, status: 'Completed' },
      { name: "Tokenized Urban Development", description: "Real-estate fractionalization engine for sovereign investors.", client: "Urban Dev", value: 6700000, status: 'Pending' },
      { name: "Vedic Syntax Compiler", description: "Specialized code compiler optimized for logic throughput in indigenous languages.", client: "Bharat R&D", value: 3400000, status: 'Active' },
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
        id: 'about-swaraj', 
        slug: 'about-swaraj', 
        title: 'Swaraj Philosophy', 
        content: '# Digital Sovereignty\n\nDigital sovereignty is the fundamental right of every individual in the 21st century. It means having absolute control over your digital footprint, identity, and assets.\n\n## Core Focus\n- **Decentralized Systems**: No single point of failure.\n- **AI Intelligence OS**: Intelligence that serves the individual.\n- **Sovereign Architecture**: Secure, private, and localized compute.' 
      },
      { 
        id: 'agent-0690-protocol', 
        slug: 'agent-0690-protocol', 
        title: 'Agent 0690 Intelligence', 
        content: '# Agent 0690 Protocol\n\nThe primary autonomous intelligence layer of the Swaraj ecosystem.\n\n### Capabilities\n1. **Corporate Scanning**: Real-time market intelligence gathering.\n2. **Sentiment Analysis**: Understanding global sentiment shifts.\n3. **Risk Mitigation**: Predicting financial shifts before they occur.' 
      }
    ];
    pages.forEach(p => setDoc(doc(wikiRef, p.id), p));
  }

  const newsRef = collection(db, 'news');
  const newsSnap = await getDocs(newsRef);
  if (newsSnap.empty) {
    const newsItems = [
      { headline: "Swaraj Identity OS Beta Launch", description: "The much-awaited sovereign digital identity system enters open beta, allowing users to reclaim their data.", tags: ["Product", "Launch"], featuredImageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2000" },
      { headline: "AI Safety Protocol V2 Released", description: "Our research wing has finalized the implementation of the V2 Safety Protocol, ensuring AI safety and alignment.", tags: ["AI", "Research"], featuredImageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2000" },
      { headline: "Series A: $50M Funding Secured", description: "Swaraj Digital Sovereignty closes major funding round to accelerate development of autonomous infrastructure.", tags: ["Growth", "Finance"], featuredImageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536ad0a?auto=format&fit=crop&q=80&w=2000" },
      { headline: "The Decentralization Manifesto", description: "Founder Akrit Pandey releases the official roadmap for global digital autonomy.", tags: ["Manifesto", "Vision"], featuredImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" },
      { headline: "Agent 0690 Node Expansion", description: "Network reach exceeds 1.2M nodes across 4 continents, establishing a true global intelligence mesh.", tags: ["Infrastructure", "Nodes"], featuredImageUrl: "https://images.unsplash.com/photo-1510511459019-5dee997ddfdf?auto=format&fit=crop&q=80&w=2000" }
    ];
    newsItems.forEach(item => {
      addDoc(collection(db, 'news'), {
        ...item,
        createdAt: serverTimestamp(),
        imageUrls: item.featuredImageUrl ? [item.featuredImageUrl] : [],
        videoUrls: [],
        fileUrls: [],
      });
    });
  }

  // Jobs
  const jobsSnap = await getDocs(query(collection(db, 'jobs'), limit(1)));
  if (jobsSnap.empty) {
    const demoJobs = [
      {
        title: "Frontend Sovereignty Engineer",
        location: "Remote / Bengaluru",
        type: "Full-time",
        salary: "₹18L - ₹25L",
        status: "Open",
        description: "Join us in building high-fidelity UI/UX for our sovereign infrastructure. Must be a master of React, Tailwind, and Motion.",
        requirements: ["3+ years React experience", "Deep knowledge of Web Performance", "Sovereign Mindset"],
        questions: ["Describe your most complex UI challenge.", "How do you optimize for performance?"],
        createdAt: serverTimestamp()
      },
      {
        title: "AI Security Architect",
        location: "New Delhi",
        type: "Contract",
        salary: "₹24L - ₹40L",
        status: "Open",
        description: "Engineering secure pipelines for LLM deployment. Focus on privacy-preserving compute.",
        requirements: ["Master's in CS or equivalent", "Experience with PyTorch", "Kubernetes master"],
        questions: ["How do you handle data privacy in LLMs?", "Experience with RAG systems?"],
        createdAt: serverTimestamp()
      }
    ];
    for (const job of demoJobs) {
      await addDoc(collection(db, 'jobs'), job);
    }
  }

  // Team
  const teamSnap = await getDocs(query(collection(db, 'team'), limit(1)));
  if (teamSnap.empty) {
    const demoTeam = [
      {
        name: "Arjun Mehta",
        role: "Node Strategist",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
        bio: "Strategizing the global expansion of sovereign data centers.",
        active: true
      },
      {
        name: "Sriya Rao",
        role: "Cryptographic Officer",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
        bio: "Securing transmissions with advanced lattice-based cryptography.",
        active: true
      }
    ];
    for (const member of demoTeam) {
      await addDoc(collection(db, 'team'), member);
    }
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
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
      case 'home': return <HomeSection setActiveTab={setActiveTab} />;
      case 'profile': return <ProfileSection isAdmin={isAdmin} />;
      case 'account': return <UserProfileSection />;
      case 'jobs': return <JobSection isAdmin={isAdmin} />;
      case 'news': return <NewsSection isAdmin={isAdmin} />;
      case 'wiki': return <WikiSection isAdmin={isAdmin} />;
      case 'dashboard': return <CompanyDashboard isAdmin={isAdmin} />;
      case 'applications': return <ApplicationsDashboard isAdmin={isAdmin} />;
      case 'crm': return <CrmSection isAdmin={isAdmin} />;
      case 'team': return <TeamSection isAdmin={isAdmin} />;
      default: return <HomeSection setActiveTab={setActiveTab} />;
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
