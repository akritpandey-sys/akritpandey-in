import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { Project, FinanceRecord } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, PieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Target, Zap, 
  Wallet, PieChart as PieIcon, ArrowUpRight, 
  Layers, Plus, Edit2, Save, ExternalLink, X 
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import ProjectModal from './ProjectModal';

export default function CompanyDashboard({ isAdmin }: { isAdmin: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [finance, setFinance] = useState<FinanceRecord[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    client: '',
    value: 0,
    status: 'Active',
    teamMembers: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      
      // Keep selected project in sync
      if (selectedProject) {
        const updated = projectsData.find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
      if (projectsData.length < 15 && isAdmin) {
        const seedProjects = [
          { name: "Intelligence Node Alpha", client: "Sovereign Tech", value: 50000, status: "Active", description: "Edge computing node for decentralized intelligence processing." },
          { name: "Neural Network Shield", client: "AI Security", value: 75000, status: "Active", description: "Advanced defensive layer for private AI model protection." },
          { name: "Data Sovereignty Audit", client: "Gov Tech", value: 100000, status: "Completed", description: "Verification of national data residency and sovereignty protocols." },
          { name: "Crypto-Asset Recon", client: "Finance", value: 125000, status: "Active", description: "Intelligence gathering on decentralized financial ecosystems." },
          { name: "AI Integration Phase 1", client: "Enterprise", value: 150000, status: "Active", description: "Initial deployment of founder-centric AI agents." },
          { name: "Decentralized Identity Mesh", client: "Secure ID", value: 180000, status: "Active", description: "Interoperable identity system for sovereign citizens." },
          { name: "Sovereign Cloud Architecture", client: "Infra", value: 200000, status: "Active", description: "Private cloud infrastructure design for high-security operations." },
          { name: "Behavioral Analytics Engine", client: "Intelligence", value: 220000, status: "Completed", description: "Pattern recognition system for predictive threat modeling." },
          { name: "Algorithmic Governance Framework", client: "Legal Tech", value: 250000, status: "Active", description: "Rule-based system for autonomous organizational control." },
          { name: "Smart City Security Protocol", client: "Urban Tech", value: 280000, status: "Active", description: "Encryption layer for connected urban infrastructure." },
          { name: "Synthetic Media Detection", client: "Truth Tech", value: 300000, status: "Active", description: "AI system to verify authenticity of transmission recordings." },
          { name: "Private LLM Deployment", client: "Corporate", value: 325000, status: "Completed", description: "Locally hosted large language model for sensitive internal data." },
          { name: "Sovereign Supply Chain", client: "Logistics", value: 350000, status: "Active", description: "Blockchain-based tracking for critical sovereign resources." },
          { name: "Autonomous Agent Swarm", client: "R&D", value: 380000, status: "Active", description: "Coordinated AI agents for automated research and development." },
          { name: "Zero-Knowledge Proofs System", client: "Privacy", value: 400000, status: "Active", description: "Verification protocols that maintain complete data anonymity." },
          { name: "Quantum-Resistant Encryption", client: "Deep Tech", value: 425000, status: "Active", description: "Post-quantum cryptographic standards implementation." },
          { name: "Global Intelligence Dashboard", client: "Defense", value: 450000, status: "Active", description: "Real-time visualization of global sovereignty metrics." },
          { name: "Sovereign AI Core", client: "Core Tech", value: 500000, status: "Active", description: "The central intelligence system for Swaraj Digital operations." }
        ];

        seedProjects.forEach(async (p) => {
          // Prevent duplicates by checking name
          if (!projectsData.some(existing => existing.name === p.name)) {
            try {
              await addDoc(collection(db, 'projects'), {
                ...p,
                mediaUrls: [],
                teamMembers: ["Akrit Pandey"],
                startDate: new Date().toISOString().split('T')[0],
                endDate: ""
              });
            } catch (e) {
              console.error("Seeding failed", e);
            }
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
    });

    let unsubFinance: (() => void) | undefined;
    
    if (isAdmin) {
      unsubFinance = onSnapshot(collection(db, 'finance'), (snapshot) => {
        setFinance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRecord)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'finance');
      });
    }

    return () => { 
      unsubProjects(); 
      if (unsubFinance) unsubFinance();
    };
  }, [isAdmin]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        mediaUrls: []
      });
      setIsAddingProject(false);
      setNewProject({ name: '', description: '', client: '', value: 0, status: 'Active', teamMembers: [], startDate: new Date().toISOString().split('T')[0], endDate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const totalRevenue = projects.reduce((acc, p) => acc + (p.value || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;
  
  const COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#6366f1'];

  const projectStatusData = [
    { name: 'Active', value: activeProjectsCount },
    { name: 'Completed', value: completedProjectsCount },
    { name: 'Pending', value: projects.filter(p => p.status === 'Pending').length },
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 border-l-4 border-l-primary relative overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Company Valuation</p>
              <h3 className="text-3xl font-black font-display">{formatCurrency(totalRevenue * 5)}</h3>
              <p className="text-xs text-green-500 font-bold flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3 h-3" /> 12% Growth this Q
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12">
            <TrendingUp className="w-24 h-24" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border-l-4 border-l-accent relative overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Active Projects</p>
              <h3 className="text-3xl font-black font-display">{activeProjectsCount}</h3>
              <p className="text-xs text-primary font-bold flex items-center gap-1 mt-2">
                <Target className="w-3 h-3" /> Max Capacity: 5
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-accent/10 text-accent">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12">
            <Layers className="w-24 h-24" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 border-l-4 border-l-green-500 relative overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Annual Revenue</p>
              <h3 className="text-3xl font-black font-display">{formatCurrency(totalRevenue)}</h3>
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-2">
                Across {projects.length} Total Engagements
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Graph */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold font-display">Revenue Intelligence</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Growth Analytics System</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">REVENUE</span>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold">PROFIT</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={finance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                <XAxis dataKey="month" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
                <Line type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold font-display mb-8">Portfolio Mix</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black">{projects.length}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Total</span>
            </div>
          </div>
          <div className="space-y-4 mt-6">
            {projectStatusData.map((status, i) => (
              <div key={status.name} className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-500">{status.name}</span>
                </div>
                <span>{status.value} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-display">Active Registry</h3>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Swaraj Digital Projects</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAddingProject(true)}
              className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 transition-transform"
            >
              <Plus className="w-5 h-5 font-black" />
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-950 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-6 py-4">Project Name</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold">{project.name}</div>
                    <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{project.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">{project.client}</td>
                  <td className="px-6 py-4 text-sm font-bold">{formatCurrency(project.value)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight",
                      project.status === 'Active' ? "bg-primary/10 text-primary" : 
                      project.status === 'Completed' ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"
                    )}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className="p-2 hover:text-primary transition-all hover:scale-110"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAddingProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAddingProject(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass-card p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black">Register New Project</h3>
                <button onClick={() => setIsAddingProject(false)}><X /></button>
              </div>
              <form onSubmit={handleAddProject} className="space-y-4">
                <input 
                  type="text" placeholder="Project Name" value={newProject.name} 
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 outline-none"
                />
                <input 
                  type="text" placeholder="Client" value={newProject.client} 
                  onChange={e => setNewProject({...newProject, client: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 outline-none"
                />
                <textarea 
                  placeholder="Intelligence Context..." value={newProject.description} 
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 outline-none min-h-[100px]"
                />
                <input 
                  type="number" placeholder="Contract Value" value={newProject.value} 
                  onChange={e => setNewProject({...newProject, value: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 outline-none"
                />
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest">INITIALIZE</button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedProject && (
          <ProjectModal 
            project={selectedProject}
            isOpen={!!selectedProject}
            onClose={() => setSelectedProject(null)}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
