'use client';

import { useMemo } from 'react';
import Link from '@/components/TransitionLink';

interface TagCloudProps {
  tags: Array<{ name: string; count: number }>;
  /** Show tags as links (default: true). Set false for a static display. */
  linked?: boolean;
  /** Maximum number of tags to display (default: all) */
  maxTags?: number;
}

const TAG_COLORS = [
  'from-pink-500 to-rose-500',
  'from-violet-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-red-500 to-pink-500',
];

export default function TagCloud({ tags, linked = true, maxTags }: TagCloudProps) {
  const sortedTags = useMemo(() => {
    const sorted = [...tags].sort((a, b) => b.count - a.count);
    return maxTags ? sorted.slice(0, maxTags) : sorted;
  }, [tags, maxTags]);

  const maxCount = useMemo(() => Math.max(...sortedTags.map((t) => t.count), 1), [sortedTags]);
  const minCount = useMemo(() => Math.min(...sortedTags.map((t) => t.count), 0), [sortedTags]);

  const getTagStyle = (count: number) => {
    const ratio = maxCount === minCount ? 0.5 : (count - minCount) / (maxCount - minCount);
    const fontSize = 0.75 + ratio * 0.75;
    const colorIndex = Math.min(
      Math.floor(ratio * (TAG_COLORS.length - 1)),
      TAG_COLORS.length - 1,
    );
    return { fontSize, colorClass: TAG_COLORS[colorIndex] };
  };

  if (sortedTags.length === 0) {
    return (
      <div className="flex justify-center py-8 text-sm text-stone-400 dark:text-stone-600">
        暂无标签
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {sortedTags.map((tag, i) => {
        const { fontSize, colorClass } = getTagStyle(tag.count);
        const content = (
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-transparent shadow-sm hover:shadow-holographic transition-all duration-500 ease-[var(--ease-out-quint)] light-ray cursor-pointer"
            style={{ fontSize: `${fontSize}rem` }}
          >
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`} />
            <span className="font-medium text-stone-700 dark:text-stone-300 group-hover:holo-text transition-all duration-300">
              {tag.name}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {tag.count}
            </span>
          </span>
        );

        return (
          <div
            key={tag.name}
            className="group"
            style={{
              animation: `scale-in 0.4s var(--ease-out-expo) ${i * 0.04}s both`,
            }}
          >
            {linked ? (
              <Link href={`/tags/${encodeURIComponent(tag.name)}`}>
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
