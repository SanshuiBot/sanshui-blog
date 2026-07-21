'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Tag, Clock } from 'lucide-react';
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

  // 3D tilt
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRX = useSpring(rotateX, { stiffness: 150, damping: 18 });
  const springRY = useSpring(rotateY, { stiffness: 150, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    rotateY.set(percentX * 6);
    rotateX.set(-percentY * 6);
  };

  const handleLeave = () => {
    mx.set(50);
    my.set(50);
    rotateX.set(0);
    rotateY.set(0);
  };

  // Tag color mapping
  const tagColors = [
    'from-pink-500/15 to-rose-500/15 dark:from-pink-500/20 dark:to-rose-500/20',
    'from-violet-500/15 to-purple-500/15 dark:from-violet-500/20 dark:to-purple-500/20',
    'from-blue-500/15 to-cyan-500/15 dark:from-blue-500/20 dark:to-cyan-500/20',
    'from-emerald-500/15 to-teal-500/15 dark:from-emerald-500/20 dark:to-teal-500/20',
    'from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.7, ease: EASE }}
      style={{ viewTransitionName: `post-card-${post.slug}` }}
      className="group relative"
    >
      {/* Prism border glow */}
      <motion.div
        aria-hidden="true"
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) =>
              `radial-gradient(250px circle at ${x} ${y}, rgba(244,114,182,0.2), rgba(192,132,252,0.15) 30%, rgba(96,165,250,0.1) 60%, transparent 70%)`,
          ),
        }}
      />

      {/* 3D tilted card */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          rotateX: springRX,
          rotateY: springRY,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
        className="relative"
      >
        {/* Outer gradient bezel with prism shimmer */}
        <div className="p-[1.5px] rounded-2xl bg-gradient-to-b from-stone-200/60 via-violet-200/30 to-transparent dark:from-stone-800/40 dark:via-violet-900/20 dark:to-transparent transition-all duration-700 ease-[var(--ease-out-quint)] group-hover:from-pink-500/40 group-hover:via-violet-500/30 group-hover:to-cyan-500/20 dark:group-hover:from-pink-500/50 dark:group-hover:via-violet-500/40 dark:group-hover:to-cyan-500/30">
          <article className="group/card relative flex flex-col bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-700 ease-[var(--ease-out-quint)] group-hover:shadow-holographic group-hover:-translate-y-1">
            {/* Top gradient accent bar */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-pink-500 group-hover:via-violet-500 group-hover:to-cyan-500 transition-all duration-1000 ease-[var(--ease-out-quint)] group-hover:h-[3px]" />

            {/* Shimmer surface */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(244,114,182,0.03) 45%, rgba(192,132,252,0.05) 50%, rgba(96,165,250,0.03) 55%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatDelay: 6,
                  ease: 'easeInOut',
                }}
              />
            </div>

            <div className="flex-1 p-6 sm:p-7 relative">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, i) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r ${tagColors[i % tagColors.length]} text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-all duration-500 ease-[var(--ease-out-quint)]`}
                  >
                    <Tag size={10} />
                    {tag}
                  </Link>
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
                <span className="group/btn relative inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 transition-colors duration-500 ease-[var(--ease-out-quint)] group-hover:text-red-600 dark:group-hover:text-red-400">
                  <span>阅读</span>
                  <span className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 group-hover/btn:bg-gradient-to-r group-hover/btn:from-pink-500/20 group-hover/btn:to-violet-500/20 dark:group-hover/btn:from-pink-500/30 dark:group-hover/btn:to-violet-500/30 transition-all duration-500 ease-[var(--ease-out-quint)] overflow-hidden">
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
    </motion.div>
  );
}
