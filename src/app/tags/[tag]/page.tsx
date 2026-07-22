import { Hash } from 'lucide-react';
import Link from 'next/link';
import { getPostsByTag, getAllTags } from '@/lib/posts';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';

export function generateStaticParams() { return getAllTags().map(t => ({ tag: t })); }
export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) { const { tag } = await params; return { title: `${decodeURIComponent(tag)} | 标签 | 三水` }; }

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = getPostsByTag(decoded);
  if (!posts.length) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/tags" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8 group/back">
        <Hash size={14} />所有标签
      </Link>
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">{decoded}</h1>
        <p className="mt-2 text-stone-500">共 {posts.length} 篇文章</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p, i) => <PostCard key={p.slug} post={p} index={i} />)}
      </div>
    </div>
  );
}
