'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
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

// pagefind is generated at build time and loaded from /pagefind/pagefind.js
// Fall back to simple client-side substring search if pagefind isn't available (dev mode)
export default function SearchDialog({ posts }: SearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pagefindReady, setPagefindReady] = useState(false);

  // Load pagefind script + index once
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
      // @ts-expect-error - pagefind injects globals
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
    // @ts-expect-error - pagefind global injected by script
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
    // Fallback: substring search
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
    return () => {
      cancelled = true;
    };
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700"
        aria-label="搜索"
      >
        <Search size={14} />
        <span>搜索...</span>
        <kbd className="hidden md:inline-flex ml-4 px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="sm:hidden p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="搜索"
      >
        <Search size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] px-4"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden"
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
                    {resolved.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/posts/${post.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
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
                        <ArrowRight size={14} className="text-stone-300 dark:text-stone-600 group-hover:text-red-500 shrink-0" />
                      </Link>
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