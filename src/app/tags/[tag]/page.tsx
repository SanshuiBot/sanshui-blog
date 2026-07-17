import { getPostsByTag, getAllTags } from '@/lib/posts';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Hash } from 'lucide-react';
import PostCard from '@/components/PostCard';
import ScrollReveal from '@/components/ScrollReveal';

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return { title: `${decodeURIComponent(tag)} | 标签 | 三水` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);

  if (posts.length === 0) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up">
        <Link
          href="/tags"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-10"
        >
          <ArrowLeft size={16} />
          所有标签
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <div className="flex items-center gap-3 mb-3">
          <Hash size={24} className="text-red-500" />
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            {decodedTag}
          </h1>
        </div>
        <p className="text-stone-500 dark:text-stone-500 mb-10">共 {posts.length} 篇文章</p>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
