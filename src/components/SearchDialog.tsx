'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import Link from '@/components/TransitionLink';
import type { Post } from '@/lib/types';

interface SearchDialogProps {
  posts: Post[];
}

interface PagefindResult {
  data: () => Promise<{ url: string; excerpt: string; meta: { title: string; date: string; tags?: string[] } }>;
  excerpt: string;
  meta: { title: string; date: string; tags?: string[] };
  url: string;
}

interface PagefindResolved {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
}

export default function SearchDialog({ posts }: SearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pagefindReady, setPagefindReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Pagefind only exists after `npm run build` writes it to out/pagefind/.
    // In dev (`next dev`) the file is never present, and attempting to load
    // it produces a noisy 404 in the console. Skip the load entirely in dev.
    if (process.env.NODE_ENV !== 'production') return;

    const existing = document.getElementById('pagefind-search');
    if (existing) {
      setPagefindReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'pagefind-search';
    script.src = '/sanshui-blog/pagefind/pagefind.js';
    script.async = true;
    script.onload = () => {
      // @ts-expect-error
      if (window.pagefind) {
        // @ts-expect-error
        window.pagefind.options({ basePath: '/sanshui-blog/pagefind/' });
        setPagefindReady(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const results = useMemo(async () => {
    const q = query.trim();
    if (!q) return [];
    // @ts-expect-error
    if (pagefindReady && window.pagefind) {
      try {
        // @ts-expect-error
        const search = await window.pagefind.search(q);
        const top: PagefindResult[] = search.results.slice(0, 8);
        const data = await Promise.all(top.map((r) => r.data()));
        const resolved: PagefindResolved[] = data.map((d) => ({
          slug: d.url.replace(/\/$/, '').split('/').pop()!,
          title: d.meta.title,
          date: d.meta.date,
          excerpt: d.excerpt,
          tags: d.meta.tags ?? [],
        }));
        return resolved;
      } catch {
        return [];
      }
    }
    const lower = q.toLowerCase();
    return posts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.excerpt.toLowerCase().includes(lower) ||
          p.tags.some((t) => t.toLowerCase().includes(lower)),
      )
      .slice(0, 8);
  }, [query, posts, pagefindReady]);

  const [resolved, setResolved] = useState<typeof posts>([]);
  useEffect(() => {
    let cancelled = false;
    results.then((r) => {
      if (!cancelled) setResolved(r as typeof posts);
    });
    return () => { cancelled = true; };
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: { duration: 0.15 },
    },
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all duration-300 border border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm group/search"
        aria-label="搜索"
      >
        <Search size={14} className="group-hover/search:text-violet-500 transition-colors" />
        <span>搜索...</span>
        <kbd className="hidden md:inline-flex ml-4 px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="sm:hidden p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="搜索"
      >
        <Search size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] px-4"
          >
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              variants={panelVariants}
              className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl shadow-holographic/30 border border-stone-200/80 dark:border-stone-800/80 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-200 dark:border-stone-800">
                <Search size={18} className="text-stone-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索文章..."
                  className="flex-1 bg-transparent text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-500 outline-none text-base"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                    <X size={16} />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-200 dark:bg-stone-700 text-stone-500">
                  ESC
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {resolved.length > 0 ? (
                  <div className="space-y-0.5">
                    {resolved.map((post, i) => (
                      <motion.div
                        key={post.slug}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                      >
                        <Link
                          href={`/posts/${post.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group result-link"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-stone-900 dark:text-stone-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                                {post.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-400">
                              <span>{post.date}</span>
                              {post.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-0.5">
                                  <Tag size={10} />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-stone-300 dark:text-stone-600 group-hover:text-violet-500 shrink-0 transition-colors" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : query ? (
                  <div className="text-center py-10 text-stone-500 dark:text-stone-500 text-sm">
                    未找到相关文章
                  </div>
                ) : (
                  <div className="text-center py-10 text-stone-400 dark:text-stone-600 text-sm">
                    输入关键词搜索文章
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
