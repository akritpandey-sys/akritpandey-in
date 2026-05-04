import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Job, NewsPost } from '../../types';
import { motion } from 'motion/react';
import { 
  Shield, 
  Brain, 
  Code, 
  Server, 
  Lock, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Globe,
  Fingerprint
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function HomeSection({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [latestNews, setLatestNews] = useState<NewsPost[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);

  useEffect(() => {
    const newsQuery = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(3));
    const unsubNews = onSnapshot(newsQuery, (snap) => {
      setLatestNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsPost)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'news'));

    const jobsQuery = query(collection(db, 'jobs'), limit(3));
    const unsubJobs = onSnapshot(jobsQuery, (snap) => {
      setFeaturedJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'jobs'));

    return () => {
      unsubNews();
      unsubJobs();
    };
  }, []);

  const services = [
    {
      title: "Sovereign AI Infrastructure",
      desc: "Architecting decentralized intelligence layers that respect user data privacy and autonomy.",
      icon: Brain,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      title: "Decentralized Web Dev",
      desc: "Building high-performance DApps and platforms on-top of our proprietary Identity OS.",
      icon: Code,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Zero-Trust Cybersecurity",
      desc: "Securing the modern enterprise with cryptographic proof systems and immutable auditing.",
      icon: Shield,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Autonomous Node Ops",
      desc: "Deploying and managing global server nodes for resilient, censorship-resistant infrastructure.",
      icon: Server,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden -mt-4 sm:-mt-8">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-primary/10 blur-[80px] md:blur-[150px] rounded-full animate-pulse" />
            <div className="absolute w-[200px] h-[200px] md:w-[600px] md:h-[600px] bg-accent/5 blur-[60px] md:blur-[120px] rounded-full -translate-x-1/2" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-none mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Swaraj Protocol v4.2 Active</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black font-display tracking-tight leading-[1] md:leading-[0.9] mb-6 md:mb-8">
            WE BUILD <br />
            <span className="text-gradient">DIGITAL SOVEREIGNTY.</span>
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-8 md:mb-10 font-medium leading-relaxed">
            Architecting the future of human-centric AI, decentralized identity, and autonomous infrastructure. Reclaim your digital node.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setActiveTab('jobs')}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-primary text-white rounded-2xl md:rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-transform group"
            >
              Start Mission <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setActiveTab('wiki')}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 glass-card rounded-2xl md:rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
            >
              The Manifesto
            </button>
          </div>
        </motion.div>

        {/* Stats strip */}
        <div className="mt-12 md:mt-20 grid grid-cols-2 lg:flex lg:flex-wrap justify-center gap-8 md:gap-12 border-y border-gray-100 dark:border-zinc-800 py-8 md:py-10 w-full max-w-5xl">
            {[
                { label: "Active Nodes", val: "1.2M", icon: Cpu },
                { label: "Data Secured", val: "840 PB", icon: Lock },
                { label: "Governance Units", val: "15,400", icon: Globe },
                { label: "Network Growth", val: "+342%", icon: TrendingUp }
            ].map(s => (
                <div key={s.label} className="text-center">
                    <p className="text-xl md:text-2xl font-black font-display mb-1">{s.val}</p>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 overflow-hidden">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-4">Core Competencies</h2>
          <h3 className="text-3xl md:text-5xl font-black font-display tracking-tight">Intelligence Nodes & Services</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-10 group hover:neo-glow transition-all duration-300"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-12", s.bg, s.color)}>
                <s.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black mb-4 tracking-tight">{s.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Briefings Section (Latest News) */}
      <section className="bg-gray-100/50 dark:bg-zinc-900/30 py-24 rounded-[3rem]">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">Latest Intel</h2>
                    <h3 className="text-4xl md:text-5xl font-black font-display tracking-tight">System Briefings</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('news')}
                  className="flex items-center gap-2 text-sm font-black uppercase text-primary hover:gap-3 transition-all"
                >
                    All Signals <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {latestNews.length > 0 ? latestNews.map(news => (
                    <div key={news.id} className="glass-card overflow-hidden group cursor-pointer" onClick={() => setActiveTab('news')}>
                        <div className="h-48 overflow-hidden">
                            <img 
                              src={news.imageUrls?.[0] || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop'} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              alt={news.headline}
                            />
                        </div>
                        <div className="p-8">
                            <h4 className="text-lg font-black mb-3 line-clamp-2 leading-tight">{news.headline}</h4>
                            <p className="text-sm text-gray-500 line-clamp-3 mb-6 leading-relaxed">{news.description}</p>
                            <div className="flex gap-2">
                                {news.tags?.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-[9px] font-black uppercase tracking-widest text-gray-400">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-3 h-48 flex items-center justify-center text-gray-400 font-mono italic opacity-50 uppercase tracking-widest text-[10px]">
                        No briefings currently decrypted...
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* Missions Section (Featured Jobs) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-4">Recruitment</h2>
                <h3 className="text-4xl md:text-5xl font-black font-display tracking-tight">Open Missions</h3>
            </div>
            <button 
              onClick={() => setActiveTab('jobs')}
              className="flex items-center gap-2 text-sm font-black uppercase text-primary hover:gap-3 transition-all"
            >
                View Board <ChevronRight className="w-4 h-4" />
            </button>
        </div>

        <div className="space-y-4">
            {featuredJobs.length > 0 ? featuredJobs.map(job => (
                <div key={job.id} onClick={() => setActiveTab('jobs')} className="glass-card p-8 flex flex-col md:flex-row items-center justify-between group hover:border-primary/30 cursor-pointer transition-all">
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <div className="w-12 h-12 bg-zinc-900 dark:bg-white flex items-center justify-center rounded-2xl group-hover:bg-primary transition-colors">
                            <Cpu className="w-6 h-6 text-white dark:text-black group-hover:text-white" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black">{job.title}</h4>
                            <p className="text-sm text-gray-500 font-medium">{job.location} • {job.type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                        <p className="text-sm font-black font-mono text-primary">{job.salary}</p>
                        <button className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )) : (
                <div className="h-24 flex items-center justify-center text-gray-400 font-mono italic opacity-50 uppercase tracking-widest text-[10px]">
                    No active recruitment missions...
                </div>
            )}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="max-w-4xl mx-auto px-4 overflow-hidden">
        <div className="bg-primary p-8 md:p-20 rounded-[2rem] md:rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl shadow-primary/50">
            <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
                <Fingerprint className="w-64 h-64 rotate-12" />
            </div>
            <div className="relative z-10">
                <h3 className="text-2xl md:text-5xl font-black font-display mb-6">READY TO JOIN THE <br className="hidden md:block" /> SOVEREIGN NETWORK?</h3>
                <p className="text-primary-foreground/70 mb-8 md:mb-10 max-w-lg mx-auto text-base md:text-lg">Your data identity is yours. Connect your node and start building the future today.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button className="w-full sm:w-auto px-10 py-5 bg-white text-primary rounded-2xl md:rounded-3xl font-black text-[10px] sm:text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-transform text-nowrap">
                        Get Identity OS
                    </button>
                    <button className="w-full sm:w-auto px-10 py-5 bg-white/10 backdrop-blur-md text-white rounded-2xl md:rounded-3xl font-black text-[10px] sm:text-sm uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all text-nowrap">
                        Developer Portal
                    </button>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
