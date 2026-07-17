'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import type { Post } from '@/lib/types';

interface SearchDialogProps {
  posts: Post[];
}

export default function SearchDialog({ posts }: SearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'tags', weight: 1.5 },
          { name: 'excerpt', weight: 1 },
          { name: 'content', weight: 0.5 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [posts],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 8).map((r) => r.item);
  }, [query, fuse]);

  // Keyboard shortcut
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
      {/* Search trigger */}
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

      {/* Overlay */}
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
              {/* Search input */}
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

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {results.length > 0 ? (
                  <div className="space-y-0.5">
                    {results.map((post) => (
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