'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Tag, Calendar, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import readingTime from 'reading-time';
import type { Post } from '@/lib/types';

interface PostReaderProps { post: Post; }
const EASE = [0.16, 1, 0.3, 1] as const;

function useCopyCodeButtons() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inject = useCallback((container: HTMLElement) => {
    container.querySelectorAll('pre').forEach((pre, i) => {
      if (pre.dataset.copyInjected === 'true') return;
      pre.dataset.copyInjected = 'true'; pre.dataset.copyId = `code-${i}`;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.setAttribute('aria-label', '复制代码');
      btn.className = 'copy-code-btn absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 bg-stone-800/90 text-stone-300 hover:bg-stone-700 hover:text-white backdrop-blur-sm z-50';
      btn.innerHTML = copiedId === `code-${i}`
        ? '<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span class="text-green-400">已复制</span>'
        : '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg><span>复制</span>';
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        if (!code) return;
        try { await navigator.clipboard.writeText(code.textContent ?? ''); setCopiedId(`code-${i}`); setTimeout(() => setCopiedId(null), 2000); } catch {}
      });
      pre.classList.add('group', 'relative'); pre.appendChild(btn);
    });
  }, [copiedId]);
  useEffect(() => () => { document.querySelectorAll('pre[data-copy-injected]').forEach(pre => { const btn = pre.querySelector('.copy-code-btn'); if (btn) pre.removeChild(btn); }); }, []);
  return { inject };
}

export default function PostReader({ post }: PostReaderProps) {
  const readTime = useMemo(() => Math.max(1, Math.ceil(readingTime(post.content, { wordsPerMinute: 300 }).minutes)), [post.content]);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => { const onScroll = () => setShowTop(window.scrollY > 300); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  const articleRef = useRef<HTMLElement>(null);
  const { inject } = useCopyCodeButtons();
  useEffect(() => { if (articleRef.current) inject(articleRef.current); }, [inject]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ viewTransitionName: 'post-reader' }} className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
        <article ref={articleRef} className="min-w-0">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="mb-10">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors group/back">
              <ArrowLeft size={14} className="transition-transform duration-300 group/back:-translate-x-1" />返回首页
            </Link>
          </motion.div>
          <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: EASE }} className="mb-12">
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500/10 to-violet-500/10 dark:from-pink-500/20 dark:to-violet-500/20 text-stone-600 dark:text-stone-400 hover:from-pink-500/20 hover:to-violet-500/20 transition-all duration-300"
                ><Tag size={10} />{tag}</Link>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight mb-6 text-balance">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-400 dark:text-stone-500">
              <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(post.date)}</span>
              <span className="text-stone-200 dark:text-stone-700">&middot;</span>
              <span className="flex items-center gap-1.5"><Clock size={14} />预计阅读 {readTime} 分钟</span>
            </div>
          </motion.header>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6, ease: EASE }} className="h-px bg-gradient-to-r from-pink-500/50 via-violet-500/30 to-cyan-500/20 mb-12" style={{ transformOrigin: 'left' }} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="prose-custom">
            <MDXRemote source={post.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }], rehypeHighlight] } }} />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="mt-16 pt-8 border-t border-stone-200/60 dark:border-stone-800/60">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-pink-500/10 to-violet-500/10 dark:from-pink-500/20 dark:to-violet-500/20 text-stone-500 hover:from-pink-500/20 hover:to-violet-500/20 transition-all duration-300"
                >#{tag}</Link>
              ))}
            </div>
          </motion.div>
        </article>
      </div>
      {showTop && (
        <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-[var(--z-sticky)] p-2.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:shadow-lg hover:shadow-iridescent/30 transition-all duration-300 active:scale-95" aria-label="回到顶部"
        ><ArrowUp size={16} /></motion.button>
      )}
    </div>
  );
}
