'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { withBase } from '@/lib/basePath';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';
import { useDismiss } from '@/components/UI/useDismiss';
import type { PostIndexEntry } from '@/lib/post-index';

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<PostIndexEntry[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { startNavigation } = useNavigationLoading();

  // 点击外部 / Esc 关闭（外点判定 + 延迟绑定统一收口在 useDismiss）
  useDismiss(panelRef, onClose, { enabled: open });

  // 首次打开时拉取轻量索引（~10KB），不再走 RSC payload
  useEffect(() => {
    if (!open || posts !== null) return;
    fetch(`${withBase('/posts-index.json')}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PostIndexEntry[]) => setPosts(data))
      .catch(() => setPosts([]));
  }, [open, posts]);

  // 关闭时清空搜索词：渲染期间调整 state（React 官方模式，避免 effect 内同步 setState）
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) setQ('');
  }

  useEffect(() => {
    if (!open) return;
    // 延迟聚焦等 DOM 就位；StrictMode 下 effect 会跑两次，
    // 用 ref 持有定时器在 cleanup 中清，避免重复触发/卸载后回调
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  const results = useMemo(() => {
    if (!posts) return [];
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return posts
      .filter(
        (p: PostIndexEntry) =>
          p.title.toLowerCase().includes(t) ||
          p.excerpt.toLowerCase().includes(t) ||
          p.tags.some((x: string) => x.toLowerCase().includes(t)),
      )
      .slice(0, 8);
  }, [q, posts]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[18vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl glass-heavy shadow-emboss-hover rounded-2xl overflow-hidden border border-white/10"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <Search size={18} className="text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索文章..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-500">
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {posts === null ? (
                <div className="text-center py-10 text-gray-500 text-sm">加载中...</div>
              ) : results.length > 0 ? (
                <div aria-live="polite" aria-atomic="true">
                  <span className="sr-only">找到 {results.length} 篇文章</span>
                  {results.map((p: PostIndexEntry, i: number) => (
                    <motion.div
                      key={p.slug}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        href={`/posts/${p.slug}/`}
                        onClick={() => {
                          onClose();
                          startNavigation();
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-white group-hover:text-accent-violet transition-colors truncate block">
                            {p.title}
                          </span>
                          <span className="text-xs text-gray-500">{fmt(p.date)}</span>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-gray-600 group-hover:text-accent-violet shrink-0"
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : q ? (
                <div className="text-center py-10 text-gray-500 text-sm" aria-live="polite">
                  未找到相关文章
                </div>
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
