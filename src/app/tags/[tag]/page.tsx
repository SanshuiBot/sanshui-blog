import { Hash } from 'lucide-react';
import { getPostsByTag, getAllTags } from '@/lib/posts';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import ScrollReveal from '@/components/ScrollReveal';
import PageHeader from '@/components/PageHeader';

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <PageHeader
        title={decodedTag}
        description={`共 ${posts.length} 篇文章`}
        backHref="/tags"
        backLabel="所有标签"
      >
        <div className="flex items-center gap-3 mt-3">
          <Hash size={24} className="text-pink-500" />
        </div>
      </PageHeader>

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
