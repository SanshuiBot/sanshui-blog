import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import ScrollReveal from '@/components/ScrollReveal';
import MorphBlob from '@/components/MorphBlob';

export default function ArchivePage() {
  const posts = getAllPosts();

  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <ScrollReveal direction="up" delay={0.05}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8 group/back"
        >
          <ArrowLeft size={16} className="transition-transform duration-300 group/back:-translate-x-1" />
          返回首页
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <div className="mb-12 relative">
          <MorphBlob color="rgba(244, 114, 182, 0.08)" size={300} className="absolute -top-10 -right-10 pointer-events-none" />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
            <BookOpen size={12} />
            归档
          </span>
          <h1
            style={{ viewTransitionName: 'page-title' }}
            className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance"
          >
            全部文章
          </h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400">共 {posts.length} 篇文章</p>
        </div>
      </ScrollReveal>

      <div className="relative">
        {years.map((year, yi) => (
          <ScrollReveal key={year} direction="up" delay={0.1 + yi * 0.1}>
            <section className="mb-12 last:mb-0">
              {/* Year badge */}
              <div className="relative mb-8 flex items-center gap-4">
                <div className="text-3xl font-bold text-stone-300 dark:text-stone-700 tracking-tight">
                  {year}
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-stone-200/50 to-transparent dark:from-stone-800/50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[year]?.map((post, i) => (
                  <PostCard key={post.slug} post={post} index={i} />
                ))}
              </div>
            </section>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
