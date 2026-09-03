'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';

interface Props {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export default function PostNav({ prev, next }: Props) {
  const { startNavigation } = useNavigationLoading();
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="上下篇导航">
      {prev ? (
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Link
            href={`/posts/${prev.slug}/`}
            prefetch={false}
            onClick={startNavigation}
            className="group flex items-start gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 transition-all duration-300 group-hover:border-accent-violet/30 relative overflow-hidden"
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-accent-violet/0 group-hover:bg-accent-violet/60 transition-colors duration-300" />
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent-violet/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <motion.span
              whileHover={{ x: -2 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <ChevronLeft
                size={18}
                className="mt-0.5 text-neutral-500 group-hover:text-accent-violet transition-colors shrink-0"
              />
            </motion.span>
            <div className="min-w-0">
              <div className="text-xs text-neutral-500 mb-1 group-hover:text-accent-violet/70 transition-colors">
                上一篇
              </div>
              <div className="text-sm font-medium text-neutral-400 group-hover:text-accent-violet/80 transition-colors truncate">
                {prev.title}
              </div>
            </div>
          </Link>
        </motion.div>
      ) : (
        <div />
      )}
      {next ? (
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="sm:col-start-2"
        >
          <Link
            href={`/posts/${next.slug}/`}
            prefetch={false}
            onClick={startNavigation}
            className="group flex items-start justify-end gap-3 p-4 rounded-xl glass border border-black/[0.06] dark:border-white/5 transition-all duration-300 group-hover:border-accent-violet/30 relative overflow-hidden"
          >
            <span className="absolute right-0 top-0 bottom-0 w-[3px] rounded-r-xl bg-accent-violet/0 group-hover:bg-accent-violet/60 transition-colors duration-300" />
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-accent-violet/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="min-w-0 text-right">
              <div className="text-xs text-neutral-500 mb-1 group-hover:text-accent-violet/70 transition-colors">
                下一篇
              </div>
              <div className="text-sm font-medium text-neutral-400 group-hover:text-accent-violet/80 transition-colors truncate">
                {next.title}
              </div>
            </div>
            <motion.span
              whileHover={{ x: 2 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <ChevronRight
                size={18}
                className="mt-0.5 text-neutral-500 group-hover:text-accent-violet transition-colors shrink-0"
              />
            </motion.span>
          </Link>
        </motion.div>
      ) : (
        <div />
      )}
    </nav>
  );
}
