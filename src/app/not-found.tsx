'use client';

import { ArrowLeft, Home, Compass } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function NotFound() {
  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4 py-20 relative">
      {/* Decorative orb */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-30 animate-float"
        style={{
          background:
            'radial-gradient(circle, rgba(220,38,38,0.4), rgba(234,88,12,0.2) 50%, transparent 80%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: EASE, duration: 0.6 }}
        className="relative text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-8xl font-bold gradient-text mb-6 leading-none"
        >
          404
        </motion.div>

        <div className="inline-flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
          <Compass size={12} />
          迷路了
        </div>

        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3 text-balance">
          页面走丢了
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-8 text-pretty">
          抱歉，你访问的页面不存在或已被移除。也许可以回到首页，或者去归档看看.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform"
          >
            <Home size={16} />
            返回首页
          </Link>
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform"
          >
            <ArrowLeft size={16} />
            浏览归档
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
