'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import type { Post } from '@/lib/types';

interface SearchDialogProps { posts: Post[] }

export default function SearchDialog({ posts }: SearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))).slice(0, 8);
  }, [query, posts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen(true); } if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="p-3 rounded-full glass-strong text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-all duration-300 shadow-lg active:scale-95" aria-label="搜索">
        <Search size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[15vh] px-4">
            <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl shadow-iridescent/20 border border-stone-200/80 dark:border-stone-800/80 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, transparent, #f472b6, #c084fc, #60a5fa, #34d399, transparent)', backgroundSize: '200% 100%' }} animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
              </div>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-200 dark:border-stone-800">
                <Search size={18} className="text-stone-400 shrink-0" />
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索文章..." className="flex-1 bg-transparent text-stone-900 dark:text-stone-50 placeholder-stone-400 outline-none text-base" />
                {query && <button onClick={() => setQuery('')} className="text-stone-400 hover:text-stone-600 transition-colors"><X size={16} /></button>}
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-200 dark:bg-stone-700 text-stone-500">ESC</kbd>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {filtered.length > 0 ? (
                  <div className="space-y-0.5">
                    {filtered.map((post, i) => (
                      <motion.div key={post.slug} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.2 }}>
                        <Link href={`/posts/${post.slug}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-stone-900 dark:text-stone-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate block">{post.title}</span>
                            <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                              <span>{formatDate(post.date)}</span>
                              {post.tags.slice(0, 2).map((tag) => <span key={tag} className="inline-flex items-center gap-0.5"><Tag size={10} />{tag}</span>)}
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-stone-300 dark:text-stone-600 group-hover:text-violet-500 shrink-0 transition-colors" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : query ? <div className="text-center py-10 text-stone-500 text-sm">未找到相关文章</div>
                  : <div className="text-center py-10 text-stone-400 dark:text-stone-600 text-sm">⌘K 打开搜索</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
