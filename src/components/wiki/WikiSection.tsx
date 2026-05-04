import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { WikiPage } from '../../types';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, BookOpen, Clock, Trash2, Edit2, Save, X, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import MediaUpload from '../ui/MediaUpload';

export default function WikiSection({ isAdmin }: { isAdmin: boolean }) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [activePage, setActivePage] = useState<WikiPage | null>(null);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPage, setEditedPage] = useState<Partial<WikiPage>>({});
  const [showImageUpload, setShowImageUpload] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'wiki'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WikiPage));
      setPages(docs);
      
      // Keep active page in sync
      if (docs.length > 0) {
        if (!activePage) {
          setActivePage(docs[0]);
        } else {
          const updatedActive = docs.find(p => p.id === activePage.id);
          if (updatedActive) setActivePage(updatedActive);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'wiki');
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    if (!editedPage.title || !editedPage.slug) return;
    const path = editedPage.id || editedPage.slug;
    try {
      await setDoc(doc(db, 'wiki', path), {
        ...editedPage,
        lastUpdated: serverTimestamp(),
        id: path
      }, { merge: true });
      setIsEditing(false);
      setActivePage({ ...editedPage, id: path } as WikiPage);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wiki/${path}`);
    }
  };

  const handleCreate = () => {
    const newPage: Partial<WikiPage> = { title: 'New Node', slug: 'new-node', content: '# New node content...', updatedBy: 'Admin' };
    setEditedPage(newPage);
    setIsEditing(true);
    setActivePage(null);
  };

  const handleMediaInsert = (url: string, type: string, name: string) => {
    const md = type === 'image' ? `\n\n![${name}](${url})\n` : `\n\n[File: ${name}](${url})\n`;
    setEditedPage(prev => ({ ...prev, content: (prev.content || '') + md }));
    setShowImageUpload(false);
  };

  const filteredPages = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
      <div className="w-full lg:w-80">
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nodes Index</h3>
            {isAdmin && <button onClick={handleCreate} className="p-2 bg-primary/10 text-primary rounded-xl"><Plus size={18} /></button>}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3 text-gray-400 w-4 h-4" />
            <input type="text" value={search || ''} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none" placeholder="Search..." />
          </div>
          <div className="space-y-2">
            {filteredPages.map(page => (
              <button key={page.id} onClick={() => { setActivePage(page); setIsEditing(false); }} className={cn("w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all", activePage?.id === page.id ? "bg-primary text-white" : "hover:bg-gray-100 dark:hover:bg-zinc-900")}>
                <span className="text-sm font-bold truncate">{page.title}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <div className="glass-card p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <input type="text" value={editedPage.title || ''} onChange={e => setEditedPage({ ...editedPage, title: e.target.value })} className="w-full bg-transparent text-4xl font-black font-display outline-none" placeholder="Title" />
                  <input type="text" value={editedPage.slug || ''} onChange={e => setEditedPage({ ...editedPage, slug: e.target.value })} className="w-full bg-transparent text-gray-500 font-mono text-xs outline-none" placeholder="slug" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowImageUpload(true)} className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-xl"><ImageIcon size={20} /></button>
                  <button onClick={handleSave} className="px-6 py-3 bg-primary text-white rounded-xl font-bold">SAVE</button>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-3 bg-gray-100 rounded-xl font-bold">X</button>
                </div>
              </div>
              <textarea value={editedPage.content || ''} onChange={e => setEditedPage({ ...editedPage, content: e.target.value })} className="w-full h-[600px] bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 font-mono outline-none" />
            </div>
          ) : activePage ? (
            <div className="glass-card p-12 space-y-10">
              <div className="border-b border-gray-100 dark:border-zinc-800 pb-8 flex justify-between items-start">
                <div>
                  <h2 className="text-6xl font-black font-display tracking-tighter">{activePage.title}</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-4">Last Sync: {activePage.lastUpdated?.toDate().toLocaleDateString()}</p>
                </div>
                {isAdmin && <button onClick={() => { setEditedPage(activePage); setIsEditing(true); }} className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl"><Edit2 size={20} /></button>}
              </div>
              <div className="prose prose-xl dark:prose-invert max-w-none prose-img:rounded-3xl prose-img:shadow-xl">
                <div className="markdown-body"><Markdown>{activePage.content}</Markdown></div>
              </div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showImageUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowImageUpload(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-lg glass-card p-8 space-y-6">
              <h3 className="text-2xl font-black">Insert Media</h3>
              <MediaUpload onUpload={handleMediaInsert} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
