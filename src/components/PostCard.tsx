'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import { TiltCard } from '@/components/ParallaxHover';

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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <TiltCard tiltDegree={6}>
        <article className="group relative flex flex-col bg-white dark:bg-stone-900/60 rounded-2xl border border-stone-200/70 dark:border-stone-800/70 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-500">
          {/* Top accent */}
          <div className="h-0.5 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500 group-hover:via-orange-400 group-hover:to-amber-400 transition-all duration-700" />

          <div className="flex-1 p-6 sm:p-7">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 line-clamp-2 tracking-tight">
              {post.title}
            </h2>

            {/* Excerpt */}
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-6 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800/60">
              <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                <Clock size={13} />
                {formatDate(post.date)}
              </div>
              <Link
                href={`/posts/${post.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-all duration-300"
              >
                阅读
                <span className="inline-flex transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>
          </div>
        </article>
      </TiltCard>
    </motion.div>
  );
}
