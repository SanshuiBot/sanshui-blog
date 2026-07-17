'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import type { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group relative flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-stone-950/50 transition-all duration-500"
    >
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex-1 p-6 sm:p-8">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-5 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-500">
            <Clock size={14} />
            {formatDate(post.date)}
          </div>
          <Link
            href={`/posts/${post.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 hover:gap-2 transition-all duration-300"
          >
            阅读 <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
