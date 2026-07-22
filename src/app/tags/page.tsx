import { Hash } from 'lucide-react';
import Link from 'next/link';
import { getAllTags, getPostsByTag } from '@/lib/posts';
import ScrollReveal from '@/components/ScrollReveal';
import TagCloud from '@/components/TagCloud';
import MorphBlob from '@/components/MorphBlob';
import SparklesComp from '@/components/Sparkles';

export default function TagsPage() {
  const tags = getAllTags();

  const tagData = tags.map((tag) => ({
    name: tag,
    count: getPostsByTag(tag).length,
  }));

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <ScrollReveal direction="up" delay={0.05}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8 group/back"
        >
          <span className="transition-transform duration-300 group/back:-translate-x-1">&larr;</span>
          返回首页
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <div className="mb-12 relative">
          <MorphBlob color="rgba(192, 132, 252, 0.08)" size={300} className="absolute -top-10 -right-10 pointer-events-none" />
          <SparklesComp count={8} className="pointer-events-none" shapes={['dot', 'star']} />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
            <Hash size={12} />
            标签
          </span>
          <h1
            style={{ viewTransitionName: 'page-title' }}
            className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance"
          >
            全部标签
          </h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400">共 {tags.length} 个标签</p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2}>
        <div className="relative">
          <TagCloud tags={tagData} />
        </div>
      </ScrollReveal>
    </div>
  );
}
