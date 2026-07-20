'use client';

import { useMemo, useState, useCallback } from 'react';
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
import TableOfContents from './TableOfContents';

interface PostReaderProps {
  post: Post;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Copy-button injected into every <pre> element after MDX renders.
 * Walks the rendered DOM, finds code blocks, and overlays a button.
 */
function useCopyCodeButtons() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inject = useCallback((container: HTMLElement) => {
    const pres = container.querySelectorAll('pre');
    pres.forEach((pre, i) => {
      if (pre.dataset.copyInjected === 'true') return;
      pre.dataset.copyInjected = 'true';
      pre.dataset.copyId = `code-${i}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', '复制代码');
      btn.className =
        'copy-code-btn absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-200';
      btn.innerHTML = '<span class="copy-text">复制</span>';
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent ?? '');
          setCopiedId(`code-${i}`);
          btn.classList.add('text-green-500');
          const text = btn.querySelector('.copy-text');
          if (text) text.textContent = '已复制';
          setTimeout(() => {
            setCopiedId(null);
            btn.classList.remove('text-green-500');
            if (text) text.textContent = '复制';
          }, 1500);
        } catch {
          // ignore
        }
      });
      // Mark the <pre> as group for hover reveal
      pre.classList.add('group', 'relative');
      pre.appendChild(btn);
    });
  }, []);

  return { inject, copiedId };
}

export default function PostReader({ post }: PostReaderProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const estimatedReadTime = useMemo(() => {
    const result = readingTime(post.content, { wordsPerMinute: 300 });
    return Math.max(1, Math.ceil(result.minutes));
  }, [post.content]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { inject } = useCopyCodeButtons();

  return (
    <div
      style={{ viewTransitionName: 'post-reader' }}
      className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24"
    >
      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
        {/* Main content */}
        <article className="min-w-0" ref={(el: HTMLElement | null) => { if (el) inject(el); }}>
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ease: EASE, duration: 0.4 }}
            className="mb-10"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200"
            >
              <ArrowLeft size={14} />
              返回首页
            </Link>
          </motion.div>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
            className="mb-12"
          >
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                >
                  <Tag size={10} />
                  {tag}
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight mb-6 text-balance">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-400 dark:text-stone-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(post.date)}
              </span>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                预计阅读 {estimatedReadTime} 分钟
              </span>
            </div>
          </motion.header>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
            className="h-px bg-gradient-to-r from-red-600/50 via-orange-500/30 to-transparent mb-12"
            style={{ transformOrigin: 'left' }}
          />

          {/* Content - MDX */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="prose-custom"
          >
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: 'wrap' }],
                    rehypeHighlight,
                  ],
                },
              }}
            />
          </motion.div>

          {/* Bottom tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 pt-8 border-t border-stone-200/60 dark:border-stone-800/60"
          >
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-300 transition-colors duration-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </motion.div>
        </article>

        {/* Sidebar - Table of Contents */}
        <aside className="hidden lg:block">
          <TableOfContents content={post.content} />
        </aside>
      </div>

      {/* Mobile TOC — render inside PostReader so it has access to content */}
      <div className="lg:hidden">
        <TableOfContents content={post.content} />
      </div>

      {/* Back to top */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 z-40 p-2.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:shadow-lg transition-all duration-300 active:scale-95"
        aria-label="回到顶部"
      >
        <ArrowUp size={16} />
      </motion.button>
    </div>
  );
}
