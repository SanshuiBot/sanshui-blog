import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import ScrollReveal from '@/components/ScrollReveal';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArchivePage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-6">
            <ArrowLeft size={16} />
            返回首页
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            全部文章
          </h1>
          <p className="mt-3 text-stone-500 dark:text-stone-500">
            共 {posts.length} 篇文章
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}