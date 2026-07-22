import PostReader from '@/components/PostReader';
import { BlogPostJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';

export function generateStaticParams() { return getAllPosts().map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '文章未找到' };
  return {
    title: post.title, description: post.excerpt, keywords: post.tags,
    authors: [{ name: '三水', url: `${baseUrl}/about` }],
    alternates: { canonical: `${baseUrl}/posts/${post.slug}` },
    openGraph: {
      title: post.title, description: post.excerpt, type: 'article', url: `${baseUrl}/posts/${post.slug}`,
      siteName: '三水 | 个人博客', locale: 'zh_CN', publishedTime: post.date, modifiedTime: post.date,
      authors: ['三水'], tags: post.tags,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <BlogPostJsonLd post={post} />
      <BreadcrumbJsonLd items={[{ name: '首页', url: '/' }, { name: post.title, url: `/posts/${post.slug}` }]} />
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-2 border-stone-200 dark:border-stone-800" /><div className="absolute inset-0 rounded-full border-2 border-transparent border-t-pink-500 border-r-violet-500 animate-spin" style={{ animationDuration: '0.8s' }} /></div>
        </div>
      }>
        <PostReader post={post} />
      </Suspense>
    </>
  );
}
