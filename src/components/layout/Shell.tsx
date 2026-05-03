import React, { useState, useEffect } from 'react';
import { 
  User, 
  Newspaper, 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  Shield, 
  Moon, 
  Sun,
  Menu,
  X,
  LogOut,
  LogIn,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, loginWithGoogle, logout } from '../../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Profile } from '../../types';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

export default function Layout({ children, activeTab, setActiveTab, isAdmin }: LayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'profiles', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as Profile);
      }
    });
    return unsubProfile;
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navItems = [
    { id: 'profile', label: 'Founder', icon: User },
    { id: 'news', label: 'Feed', icon: Newspaper },
    { id: 'wiki', label: 'Wiki', icon: BookOpen },
    { id: 'dashboard', label: 'Company', icon: LayoutDashboard },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card mx-4 my-2 border-none rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center rounded-xl border border-primary/30">
              <Fingerprint className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display leading-tight tracking-tighter">SWARAJ</h1>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold opacity-80">Intelligence OS</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 mr-2 rounded-xl h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200 dark:border-zinc-800">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none">{profile?.name || user.displayName || 'Admin'}</p>
                  <p className="text-[10px] text-primary font-black">{isAdmin ? 'AUTHORIZED ADMIN' : 'AUTHORIZED VISITOR'}</p>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                  <img 
                    src={profile?.photoUrl || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'A'}`} 
                    className="relative w-10 h-10 rounded-full border-2 border-white dark:border-black object-cover" 
                    alt="Profile" 
                  />
                </div>
                <button 
                  onClick={logout}
                  className="p-2 h-10 w-10 flex items-center justify-center hover:text-red-500 transition-all hover:scale-110"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            )}

            <button 
              className="md:hidden p-2 ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-4 top-20 z-40 glass-card p-4 space-y-2"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                  activeTab === item.id 
                    ? "bg-primary text-white" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 pt-4">
        {children}
      </main>

      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>© 2026 Swaraj Digital Sovereignty. Built by Founder Intelligence.</p>
        {isAdmin && (
          <div className="mt-2 text-primary flex items-center justify-center gap-1 font-mono text-[10px]">
            <Shield className="w-3 h-3" />
            ADMIN PRIVILEGE ENABLED
          </div>
        )}
      </footer>
    </div>
  );
}
