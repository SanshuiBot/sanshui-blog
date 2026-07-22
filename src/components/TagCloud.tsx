'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface TagCloudProps { tags: { name: string; count: number }[] }

export default function TagCloud({ tags }: TagCloudProps) {
  if (!tags.length) return <div className="text-center py-16 text-stone-500">暂无标签</div>;

  const maxCount = Math.max(...tags.map((t) => t.count));

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {tags.map((tag, i) => {
        const scale = 0.8 + (tag.count / maxCount) * 0.8;
        const colors = ['#f472b6', '#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];
        const color = colors[i % colors.length];
        return (
          <motion.div key={tag.name} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <Link href={`/tags/${encodeURIComponent(tag.name)}`}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full glass hover:shadow-iridescent transition-all duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1"
              style={{ transform: `scale(${scale})` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">{tag.name}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">({tag.count})</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
