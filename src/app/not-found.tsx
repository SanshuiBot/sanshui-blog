'use client';

import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-8xl font-bold gradient-text mb-6"
        >
          404
        </motion.div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3">
          页面走丢了
        </h1>
        <p className="text-stone-500 dark:text-stone-500 mb-8">
          抱歉，你访问的页面不存在或已被移除。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft size={16} />
            返回首页
          </Link>
        </div>
      </motion.div>
    </div>
  );
}