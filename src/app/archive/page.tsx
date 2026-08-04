/**
 * 归档页（Archive / 全部文章）
 * -----------------------------
 * 作用：按年份分组列出站点全部文章，提供时间线式的浏览入口。
 *
 * 用法：
 *  - 服务端组件，getAllPosts() 返回的文章按 date 的年份分组，年份降序排列。
 *  - 每个年份分组复用 <PostCard> 渲染卡片网格（1/2/3 列响应式）。
 *  - 顶部提供"返回首页"链接，使用 lucide-react 的 ArrowLeft 图标。
 *  - 数据在构建时静态化，无运行时开销。
 *  - 「全部文章」标题右侧挂一个 <FilterDropdown>，点击展开 tag chip 浮层，
 *    用于按标签筛选。浮层绝对定位，不挤压下方文章网格。
 */
import { getAllPosts, getAllTags, getPostsByTag } from '@/lib/posts';
import PostCard from '@/components/Post/PostCard';
import FilterDropdown from '@/components/Archive/FilterDropdown';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function ArchivePage() {
  const posts = getAllPosts();
  const grouped: Record<string, typeof posts> = {};
  posts.forEach((p) => {
    const y = new Date(p.date).getFullYear().toString();
    (grouped[y] ??= []).push(p);
  });
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  // 标题右侧筛选按钮的下拉数据：按文章数降序，最多 16 个
  const tags = getAllTags()
    .map((t) => ({ name: t, count: getPostsByTag(t).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="link-back inline-flex items-center gap-1.5 text-sm mb-8">
        <ArrowLeft size={14} className="link-arrow" />
        返回首页
      </Link>

      <div className="mb-14 flex items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4">
            <BookOpen size={12} />
            归档
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">全部文章</h1>
          <p className="mt-3 text-gray-500">共 {posts.length} 篇文章</p>
        </div>
        {tags.length > 0 && <FilterDropdown tags={tags} />}
      </div>

      {years.map((year) => (
        <section key={year} className="mb-14 last:mb-0">
          <div className="relative mb-8 flex items-center gap-5">
            <div className="text-3xl font-bold text-gray-500 tracking-tight">{year}</div>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {(grouped[year] ?? []).map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
