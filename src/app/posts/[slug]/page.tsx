import PostReader from '@/components/PostReader';
import ReadingProgress from '@/components/ReadingProgress';
import { BlogPostJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '文章未找到' };
  return {
    title: `${post.title} | 三水`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <ReadingProgress />
      <BlogPostJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: '首页', url: '/' },
          { name: post.title, url: `/posts/${post.slug}` },
        ]}
      />
      <PostReader post={post} />
    </>
  );
}
