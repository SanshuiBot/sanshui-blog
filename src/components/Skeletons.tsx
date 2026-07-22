'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function PageSkeleton() {
  return (
    <div className="min-h-[80vh] space-y-8">
      {/* Header skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4 py-4 border-b border-stone-200 dark:border-stone-800"
      >
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </motion.div>

      {/* Title skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-2"
      >
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </motion.div>

      {/* Metadata skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-6"
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </motion.div>

      {/* Content paragraphs */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-4 w-8 mt-1.5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Code block skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-3/4 rounded" />
          </div>
        </div>
      </motion.div>

      {/* Image placeholder skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-lg aspect-video bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-stone-400 dark:text-stone-600 text-sm">图片加载中...</div>
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}

export function PostListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="group relative rounded-2xl overflow-hidden"
        >
          {/* Prism border glow */}
          <div className="absolute -inset-px rounded-2xl opacity-0" />

          {/* Skeleton card */}
          <div className="relative flex flex-col bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl overflow-hidden">
            {/* Top gradient accent bar */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent" />

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

            <div className="flex-1 p-6 space-y-4">
              {/* Tag skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              {/* Title skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>

              {/* Excerpt skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>

              {/* Meta skeleton */}
              <div className="flex items-center justify-between pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function CategoryListSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="group relative p-5 rounded-2xl bg-white/60 dark:bg-stone-900/60 backdrop-blur border border-stone-200/50 dark:border-stone-800/50">
            <div className="text-3xl font-bold holo-text-static mb-1">
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="text-sm text-stone-500 dark:text-stone-500 mt-1">
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}