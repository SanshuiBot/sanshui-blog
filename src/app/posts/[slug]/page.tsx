/**
 * 文章详情页（Post Detail / 动态路由 [slug]）
 * -----------------------------
 * 作用：渲染单篇 markdown 文章的完整内容页，包含元信息、正文、目录、上下篇导航。
 *
 * 用法：
 *  - 动态路由，slug 即文章文件名（可能含中文）。generateStaticParams() 在构建时
 *    为每篇文章预生成静态 HTML，实现全静态导出。
 *  - generateMetadata() 根据文章 frontmatter 动态生成 title / description / keywords / OG。
 *  - 中文 slug 注意：getPostBySlug() 内部已做 decodeURIComponent，但本层拿到的 slug
 *    仍可能是 URL 编码的，必要时需自行 decode（参见 AGENTS.md 陷阱 #5）。
 *  - 组件为 async 服务端组件，params 为 Promise（Next 15+ 行为）。
 *  - 文章不存在时调用 notFound() 触发 404 页面。
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPostBySlug, getAllPosts, getAdjacentPosts } from '@/lib/posts';
import { extractHeadings } from '@/lib/toc';
import PostContent from '@/components/Post/PostContent';
import PostMeta from '@/components/Post/PostMeta';
import PostNav from '@/components/Post/PostNav';
import PostDone from '@/components/Post/PostDone';
import PostComments from '@/components/Post/PostComments';
import TableOfContents from '@/components/Post/TableOfContents';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: { title: post.title, description: post.excerpt, type: 'article', tags: post.tags },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const { prev, next } = getAdjacentPosts(slug);

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
      {/* 桌面端：正文左、目录 sticky 右；移动端：目录抽屉在正文上方。
          TOC 在 DOM 中置前，lg 下用 order 恢复「正文左、目录右」 */}
      <div className="lg:flex lg:gap-10">
        <TableOfContents items={headings} />
        <div className="flex-1 min-w-0 max-w-3xl lg:order-1">
          <PostMeta post={post} />
          <PostContent content={post.content} />
          <PostNav
            prev={prev ? { slug: prev.slug, title: prev.title } : null}
            next={next ? { slug: next.slug, title: next.title } : null}
          />
          <PostComments />
        </div>
      </div>
      <PostDone />
    </div>
  );
}
