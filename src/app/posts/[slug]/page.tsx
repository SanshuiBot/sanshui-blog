import PostReader from '@/components/PostReader';
import ReadingProgress from '@/components/ReadingProgress';
import { BlogPostJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { notFound } from 'next/navigation';

const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '文章未找到' };

  const url = `${baseUrl}/posts/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: '三水', url: `${baseUrl}/about` }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url,
      siteName: '三水 | 个人博客',
      locale: 'zh_CN',
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: ['三水'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
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
