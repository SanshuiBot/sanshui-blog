import { getAllTags, getPostsByTag } from '@/lib/posts';
import Link from 'next/link';
import { ArrowLeft, Hash } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-10">
          <ArrowLeft size={16} />
          返回首页
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-3">
          标签
        </h1>
        <p className="text-stone-500 dark:text-stone-500 mb-10">
          共 {tags.length} 个标签
        </p>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2}>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => {
            const count = getPostsByTag(tag).length;
            return (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all duration-300"
              >
                <Hash size={14} className="text-stone-400 group-hover:text-red-500 transition-colors" />
                <span className="font-medium text-stone-900 dark:text-stone-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {tag}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </ScrollReveal>
    </div>
  );
}