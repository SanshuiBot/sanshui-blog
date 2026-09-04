/**
 * 标签详情页（Tag Detail / 动态路由 [tag]）
 * -----------------------------
 * 作用：展示某个标签下的全部文章，按 PostCard 网格呈现。
 *
 * 用法：
 *  - 动态路由，tag 即标签名（可能含中文 / 空格）。generateStaticParams() 在构建时
 *    为每个标签预生成静态 HTML。
 *  - 中文 tag 注意：URL 中的 tag 是 encodeURIComponent 编码的，必须 decodeURIComponent
 *    后再传给 getPostsByTag()（参见 AGENTS.md 陷阱 #5）。
 *  - generateMetadata() 动态生成 "#<标签>" 标题。
 *  - 若该标签下无文章，调用 notFound() 触发 404。
 *  - 组件为 async 服务端组件，params 为 Promise（Next 15+ 行为）。
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPostsByTag, getAllTags } from '@/lib/posts';
import { toIndexEntry } from '@/lib/post-index';
import PostGrid from '@/components/Post/PostGrid';
import ArrowLink from '@/components/UI/ArrowLink';
import { Hash } from 'lucide-react';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return { title: `#${decoded}`, description: `${decoded} - 标签页` };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  // 只投影索引 5 字段再透传 client PostGrid，避免全文 markdown 进 RSC payload（ADR-0004）
  const posts = getPostsByTag(decoded).map(toIndexEntry);
  if (posts.length === 0) notFound();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <ArrowLink
        href="/tags/"
        dir="back"
        className="link-back inline-flex items-center gap-1.5 text-sm mb-8"
      >
        返回标签
      </ArrowLink>
      <div className="mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4">
          <Hash size={12} />
          标签
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight dark:text-fg">
          <span className="text-aurora">#{decoded}</span>
        </h1>
        <p className="mt-3 text-stone-500 dark:text-gray-500">共 {posts.length} 篇文章</p>
      </div>
      <PostGrid posts={posts} />
    </div>
  );
}
