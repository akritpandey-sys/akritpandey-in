import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { NewsPost } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Calendar, Tag, Trash2, Edit2, ChevronRight, ChevronLeft, Image as ImageIcon, Film, FileText, Upload, Play, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import MediaUpload from '../ui/MediaUpload';

export default function NewsSection({ isAdmin }: { isAdmin: boolean }) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState<Partial<NewsPost>>({
    headline: '',
    subheadline: '',
    description: '',
    imageUrls: [],
    videoUrls: [],
    fileUrls: [],
    tags: [],
    featuredImageUrl: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsPost));
      setPosts(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'news');
    });
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.headline || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'news'), {
        ...newPost,
        createdAt: serverTimestamp(),
      });
      setNewPost({ headline: '', subheadline: '', description: '', imageUrls: [], videoUrls: [], fileUrls: [], tags: [], featuredImageUrl: '' });
      setShowCreate(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'news');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this Intelligence Briefing?')) {
      try {
        await deleteDoc(doc(db, 'news', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `news/${id}`);
      }
    }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video' | 'file', name: string) => {
    if (type === 'image') {
      setNewPost(prev => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), url],
        featuredImageUrl: prev.featuredImageUrl || url 
      }));
    } else if (type === 'video') {
      setNewPost(prev => ({
        ...prev,
        videoUrls: [...(prev.videoUrls || []), url]
      }));
    } else {
      setNewPost(prev => ({
        ...prev,
        fileUrls: [...(prev.fileUrls || []), url]
      }));
    }
  };

  const removeMedia = (url: string, type: 'image' | 'video' | 'file') => {
    if (type === 'image') {
      setNewPost(prev => ({
        ...prev,
        imageUrls: prev.imageUrls?.filter(u => u !== url),
        featuredImageUrl: prev.featuredImageUrl === url ? (prev.imageUrls?.filter(u => u !== url)[0] || '') : prev.featuredImageUrl
      }));
    } else if (type === 'video') {
      setNewPost(prev => ({
        ...prev,
        videoUrls: prev.videoUrls?.filter(u => u !== url)
      }));
    } else {
      setNewPost(prev => ({
        ...prev,
        fileUrls: prev.fileUrls?.filter(u => u !== url)
      }));
    }
  };

  const addTag = () => {
    if (tagInput && !newPost.tags?.includes(tagInput)) {
      setNewPost(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput] }));
      setTagInput('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-5xl font-black font-display tracking-tighter mb-2">INTELLIGENCE BRIEFINGS</h2>
          <p className="text-gray-500 font-medium tracking-[0.2em] uppercase text-xs">Internal & Public Sovereignty Updates</p>
        </div>
        {isAdmin && !showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="group flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            NEW BROADCAST
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-10 border-primary/20"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2 block">Headline</label>
                    <input 
                      type="text" 
                      value={newPost.headline}
                      onChange={e => setNewPost({...newPost, headline: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none text-xl font-bold"
                      placeholder="Transmission Title..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2 block">Content</label>
                    <textarea 
                      value={newPost.description}
                      onChange={e => setNewPost({...newPost, description: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none min-h-[200px]"
                      placeholder="Share the full details of the briefing..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2 block">Media Resources</label>
                    <MediaUpload 
                      onUpload={handleMediaUpload}
                      label="Drop Images, Videos or PDFs"
                      className="mb-4"
                    />
                    
                    <div className="grid grid-cols-4 gap-3">
                      {newPost.imageUrls?.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                          <img src={url} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeMedia(url, 'image')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {newPost.videoUrls?.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-black flex items-center justify-center">
                          <Film className="text-white opacity-40" />
                          <button 
                            type="button" 
                            onClick={() => removeMedia(url, 'video')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2 block">Tags</label>
                    <div className="flex gap-2 mb-3">
                      {newPost.tags?.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold flex items-center gap-2">
                          {tag}
                          <button type="button" onClick={() => setNewPost({...newPost, tags: newPost.tags?.filter(t => t !== tag)})}><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm"
                        placeholder="Add tag..."
                      />
                      <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-200 dark:bg-zinc-800 rounded-xl text-xs font-bold uppercase">Add</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                <button type="button" onClick={() => setShowCreate(false)} className="px-8 py-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Abort</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-primary text-white rounded-2xl text-sm font-black disabled:opacity-50">PUBLISH</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <NewsCard key={post.id} post={post} isAdmin={isAdmin} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

function NewsCard({ post, isAdmin, onDelete }: { post: NewsPost, isAdmin: boolean, onDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const allVisualMedia = [
    ...(post.imageUrls || []).map(u => ({ url: u, type: 'image' })), 
    ...(post.videoUrls || []).map(u => ({ url: u, type: 'video' }))
  ];

  return (
    <>
      <motion.div 
        className="glass-card overflow-hidden flex flex-col group cursor-pointer hover:neo-glow transition-all duration-300"
        onClick={() => setIsExpanded(true)}
      >
        <div className="relative h-56 bg-zinc-950 overflow-hidden">
          {post.featuredImageUrl || (post.imageUrls && post.imageUrls[0]) ? (
            <img src={post.featuredImageUrl || post.imageUrls[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-800"><ImageIcon size={40} /></div>
          )}
          {allVisualMedia.length > 1 && (
            <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/50 text-white text-[8px] font-bold rounded-md backdrop-blur-md">
              1 / {allVisualMedia.length} MEDIA
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-black font-display leading-tight">{post.headline}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.description}</p>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary pt-2 border-t border-gray-100 dark:border-zinc-800">
            <span>READ BRIEFING</span>
            {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={14} /></button>}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsExpanded(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-6xl bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-2xl">
              <button onClick={() => setIsExpanded(false)} className="absolute top-6 right-6 z-[110] p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all group">
                <X className="group-hover:rotate-90 transition-transform" />
              </button>
              
              <div className="w-full md:w-2/3 bg-black flex items-center justify-center relative group/media overflow-hidden min-h-[300px]">
                {allVisualMedia.length > 0 && (
                  <>
                    <div className="w-full h-full flex items-center justify-center">
                      {allVisualMedia[currentMediaIndex].type === 'image' ? (
                        <img src={allVisualMedia[currentMediaIndex].url} className="max-h-full object-contain" alt="" />
                      ) : (
                        <video src={allVisualMedia[currentMediaIndex].url} controls autoPlay className="max-h-full" />
                      )}
                    </div>
                    {allVisualMedia.length > 1 && (
                      <div className="absolute inset-x-4 flex justify-between items-center opacity-0 group-hover/media:opacity-100 transition-opacity">
                         <button onClick={() => setCurrentMediaIndex(i => (i > 0 ? i - 1 : allVisualMedia.length - 1))} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white"><ChevronLeft /></button>
                         <button onClick={() => setCurrentMediaIndex(i => (i < allVisualMedia.length - 1 ? i + 1 : 0))} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white"><ChevronRight /></button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="w-full md:w-1/3 p-10 md:p-12 overflow-y-auto bg-white dark:bg-zinc-950">
                <div className="space-y-8">
                   <div className="space-y-2">
                     <div className="flex flex-wrap gap-2">
                       {post.tags.map(tag => (
                         <span key={tag} className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{tag}</span>
                       ))}
                     </div>
                     <h2 className="text-4xl font-black font-display tracking-tight leading-tight">{post.headline}</h2>
                   </div>
                   <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap font-light">{post.description}</p>
                   {post.fileUrls && post.fileUrls.length > 0 && (
                     <div className="space-y-4 pt-8 border-t border-gray-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resource Access</p>
                        {post.fileUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl hover:bg-primary/5 transition-colors group">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary" />
                              <span className="text-sm font-bold truncate max-w-[150px]">ATTACHMENT_{i+1}</span>
                            </div>
                            <ExternalLink size={14} className="text-gray-400 group-hover:text-primary" />
                          </a>
                        ))}
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
