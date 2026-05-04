import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Message, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  User, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Search, 
  X, 
  Filter, 
  MessageSquare, 
  Users,
  Shield,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CrmSectionProps {
  isAdmin: boolean;
}

export default function CrmSection({ isAdmin }: CrmSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'messages' | 'users'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin) return;

    const unsubMessages = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    setLoading(false);
    return () => { unsubMessages(); unsubUsers(); };
  }, [isAdmin]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `messages/${id}`);
    }
  };

  const deleteMessage = async (id: string) => {
    if (window.confirm('CRITICAL: Purge this signal from the data stream?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
        console.log(`Signal ${id} deleted.`);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `messages/${id}`);
      }
    }
  };

  const deleteUser = async (user: UserProfile) => {
    if (window.confirm(`DANGER: De-authorize node "${user.name}"? This will terminate their core identity file.`)) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        console.log(`User node ${user.id} terminated.`);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.id}`);
      }
    }
  }

  const filteredMessages = messages.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <Shield className="w-16 h-16 text-gray-800" />
        <h2 className="text-2xl font-black uppercase italic">Access Restricted</h2>
        <p className="text-gray-500 font-mono text-xs">Admin authorization required for CRM systems.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-black font-display tracking-tight uppercase italic">Intelligence <span className="text-gray-400">/ CRM</span></h2>
          </div>
          <p className="text-sm text-gray-500 font-mono tracking-wider ml-12">MANAGING USER IDENTITIES AND EXTERNAL SIGNALS.</p>
        </div>

        <div className="flex gap-2 p-1 glass-card border-gray-200 dark:border-zinc-800">
          <button 
            onClick={() => setActiveSubTab('messages')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeSubTab === 'messages' ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            Messages
          </button>
          <button 
            onClick={() => setActiveSubTab('users')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeSubTab === 'users' ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            Users
          </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder={`Search ${activeSubTab}...`} 
          value={searchTerm || ''}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 glass-card border-gray-200 dark:border-zinc-800"
        />
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'messages' ? (
          <motion.div 
            key="messages"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 gap-4"
          >
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "p-6 glass-card border-l-4 transition-all hover:scale-[1.01]",
                  msg.read ? "border-l-gray-300 opacity-60" : "border-l-primary shadow-xl shadow-primary/10"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Signal Source: {msg.email}</span>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black font-display tracking-tight text-gray-800 dark:text-gray-100">
                      {msg.subject}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    {!msg.read && (
                      <button onClick={() => markAsRead(msg.id)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all">
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    <button onClick={() => deleteMessage(msg.id)} className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black">
                      {msg.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-gray-500">{msg.name}</span>
                  </div>
                  <button className="text-[9px] font-black uppercase text-primary tracking-widest hover:underline flex items-center gap-1">
                    Replying Interface <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            ))}
            {filteredMessages.length === 0 && (
              <div className="p-20 text-center glass-card">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">No signals detected.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="users"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredUsers.map((user) => (
              <div key={user.id} className="glass-card p-6 hover:border-primary/50 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-0 group-hover:opacity-40 transition-all" />
                    <img 
                      src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}`} 
                      className="relative w-16 h-16 rounded-full object-cover border-2 border-white dark:border-zinc-900"
                      alt={user.name}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black font-display truncate">{user.name}</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-mono truncate">{user.role}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl text-[10px] font-mono">
                    <span className="text-gray-400">EMAIL</span>
                    <span className="text-gray-800 dark:text-gray-200">{user.email}</span>
                  </div>
                  
                  {user.resumeUrl && (
                    <a 
                      href={user.resumeUrl} 
                      target="_blank" 
                      className="flex items-center justify-center gap-2 w-full py-3 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <ExternalLink size={12} /> View Credentials
                    </a>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex gap-1">
                      <Shield className={cn("w-4 h-4", user.role === 'admin' ? "text-primary" : "text-gray-300")} />
                      <User className={cn("w-4 h-4", user.role === 'user' ? "text-primary" : "text-gray-300")} />
                    </div>
                    <button 
                      onClick={() => deleteUser(user)}
                      className="text-[8px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Terminate Node
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full p-20 text-center glass-card">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">No identities found.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
