'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SearchModal({ posts, open, onClose }: { posts: any[]; open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); else setQ('') }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); return } if (e.key === 'Escape') onClose() };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return posts.filter((p: any) => p.title.toLowerCase().includes(t) || p.excerpt.toLowerCase().includes(t) || p.tags.some((x: string) => x.toLowerCase().includes(t))).slice(0, 8);
  }, [q, posts]);

  const fmt = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[18vh] px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-xl glass-heavy rounded-2xl overflow-hidden border border-white/10">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <Search size={18} className="text-gray-500 shrink-0" />
              <input ref={inputRef} type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="搜索文章..." className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base" />
              {q && <button onClick={() => setQ('')} className="text-gray-500 hover:text-white"><X size={16} /></button>}
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-500">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length > 0 ? (
                results.map((p: any, i: number) => (
                  <motion.div key={p.slug} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link href={`/posts/${p.slug}`} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="flex-1 min-w-0"><span className="font-medium text-white group-hover:text-accent-violet transition-colors truncate block">{p.title}</span><span className="text-xs text-gray-500">{fmt(p.date)}</span></div>
                      <ArrowRight size={14} className="text-gray-600 group-hover:text-accent-violet shrink-0" />
                    </Link>
                  </motion.div>
                ))
              ) : q ? (
                <div className="text-center py-10 text-gray-500 text-sm">未找到相关文章</div>
              ) : (
                <div className="text-center py-10 text-gray-600 text-sm">⌘K 搜索</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
