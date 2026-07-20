'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import type { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
  index: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function PostCard({ post, index }: PostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Cursor-following glow
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 200, damping: 30 });
  const sy = useSpring(my, { stiffness: 200, damping: 30 });
  const glowX = useTransform(sx, (v) => `${v}%`);
  const glowY = useTransform(sy, (v) => `${v}%`);

  const handleMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.7, ease: EASE }}
      style={{ viewTransitionName: `post-card-${post.slug}` }}
      ref={cardRef}
      onMouseMove={handleMove}
      className="group relative"
    >
      {/* Cursor-following glow */}
      <motion.div
        aria-hidden="true"
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) =>
              `radial-gradient(220px circle at ${x} ${y}, rgba(220,38,38,0.18), transparent 65%)`,
          ),
        }}
      />

      {/* Outer gradient bezel */}
      <div className="p-[1px] rounded-2xl bg-gradient-to-b from-stone-200/60 to-transparent dark:from-stone-800/40 dark:to-transparent transition-all duration-700 ease-[var(--ease-out-quint)] group-hover:from-red-500/30 group-hover:via-orange-400/20 group-hover:to-transparent dark:group-hover:from-red-500/40">
        <article className="group/card relative flex flex-col bg-white/85 dark:bg-stone-900/85 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-700 ease-[var(--ease-out-quint)] group-hover:shadow-[0_20px_60px_-12px_rgba(220,38,38,0.18)] dark:group-hover:shadow-[0_20px_60px_-12px_rgba(248,113,113,0.18)] group-hover:-translate-y-1">
          {/* Top gradient accent that grows on hover */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-red-500 group-hover:via-orange-400 group-hover:to-amber-400 transition-all duration-1000 ease-[var(--ease-out-quint)] group-hover:h-[3px]" />

          <div className="flex-1 p-6 sm:p-7">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 group-hover:text-red-600 dark:group-hover:text-red-400 transition-all duration-500 ease-[var(--ease-out-quint)]"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-500 ease-[var(--ease-out-quint)] line-clamp-2 tracking-tight">
              <Link href={`/posts/${post.slug}`} className="after:absolute after:inset-0">
                {post.title}
              </Link>
            </h2>

            {/* Excerpt */}
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-6 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800/50">
              <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                <Clock size={13} />
                {formatDate(post.date)}
              </div>

              {/* Button-in-button trailing icon */}
              <span
                className="group/btn relative inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 transition-colors duration-500 ease-[var(--ease-out-quint)] group-hover:text-red-600 dark:group-hover:text-red-400"
              >
                <span>阅读</span>
                <span className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 group-hover/btn:bg-red-50 dark:group-hover/btn:bg-red-950/30 transition-all duration-500 ease-[var(--ease-out-quint)] overflow-hidden">
                  <ArrowRight
                    size={12}
                    className="relative transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover/btn:translate-x-0.5"
                  />
                </span>
              </span>
            </div>
          </div>
        </article>
      </div>
    </motion.div>
  );
}
