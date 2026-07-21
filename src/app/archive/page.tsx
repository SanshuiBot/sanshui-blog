import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import ScrollReveal from '@/components/ScrollReveal';
import AuroraDivider from '@/components/AuroraDivider';
import MorphBlob from '@/components/MorphBlob';

export default function ArchivePage() {
  const posts = getAllPosts();

  // Group by year
  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
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
          <MorphBlob
            color="rgba(244, 114, 182, 0.08)"
            size={300}
            className="absolute -top-10 -right-10 pointer-events-none"
          />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
            <BookOpen size={12} />
            归档
          </span>
          <h1
            style={{ viewTransitionName: 'page-title' }}
            className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance animate-fade-up"
          >
            全部文章
          </h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400">共 {posts.length} 篇文章</p>
        </div>
      </ScrollReveal>

      {/* Timeline */}
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
          <div
            className="absolute inset-0 w-full"
            style={{
              background: 'linear-gradient(to bottom, transparent, #f472b6, #c084fc, #60a5fa, transparent)',
              backgroundSize: '100% 200%',
              animation: 'gradient-shift 6s ease infinite',
            }}
          />
        </div>

        {years.map((year, yi) => (
          <ScrollReveal key={year} direction="up" delay={0.1 + yi * 0.1}>
            <div className="relative pl-16 sm:pl-0">
              {/* Year marker */}
              <div className="absolute left-0 sm:left-1/2 -translate-x-1/2 top-0 z-10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center shadow-holographic">
                  <span className="text-white text-xs font-bold">{year}</span>
                </div>
                {/* Pulse ring */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
                  style={{
                    animation: 'pulse-glow 3s ease-in-out infinite',
                  }}
                />
              </div>

              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped[year]?.map((post, i) => (
                    <PostCard key={post.slug} post={post} index={i} />
                  ))}
                </div>
              </div>

              {/* Divider between years */}
              {yi < years.length - 1 && <AuroraDivider height={40} />}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
