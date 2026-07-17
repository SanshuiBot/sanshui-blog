'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Tag, Calendar, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import TableOfContents from './TableOfContents';

interface PostReaderProps {
  post: Post;
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
    const cnChars = (post.content.match(/[\u4e00-\u9fff]/g) || []).length;
    const words = post.content.split(/\s+/).length;
    const total = cnChars + words;
    return Math.max(1, Math.ceil(total / 400));
  }, [post.content]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
        {/* Main content */}
        <article className="min-w-0">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
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
            transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight mb-6">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-400 dark:text-stone-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(post.date)}
              </span>
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
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-px bg-gradient-to-r from-red-600/50 via-orange-500/30 to-transparent mb-12"
            style={{ transformOrigin: 'left' }}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="prose-custom"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: 'wrap' }],
                rehypeHighlight,
              ]}
            >
              {post.content}
            </ReactMarkdown>
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
          <div className="sticky top-24">
            <TableOfContents content={post.content} />
          </div>
        </aside>
      </div>

      {/* Mobile TOC */}
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
