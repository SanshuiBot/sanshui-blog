/**
 * 标签总览页（Tags Index / 全部标签）
 * -----------------------------
 * 作用：列出站点全部标签及其文章数量，提供按主题浏览的入口。
 *
 * 用法：
 *  - 服务端组件，getAllTags() 聚合所有文章的 tags 字段并去重。
 *  - 每个标签的 count 通过 getPostsByTag(tag).length 计算。
 *  - 标签的颜色由 colors 数组提供，<TagList> 组件按索引循环取色。
 *  - 点击单个标签跳转到 /tags/[tag] 动态页查看该标签下所有文章。
 *  - 数据构建时静态化。
 */
import { Hash } from 'lucide-react';
import ArrowLink from '@/components/UI/ArrowLink';
import { getTagCounts } from '@/lib/posts';
import TagList from '@/components/TagList';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: '标签',
  description: `全部标签索引 · ${siteConfig.name}个人博客`,
};

export default function TagsPage() {
  // 单趟 O(N) 统计（getTagCounts），替代「每个标签一次 getPostsByTag().length」的 O(T×N) 嵌套循环
  const tags = [...getTagCounts().entries()].map(([name, count]) => ({ name, count }));
  const colors = [
    'rgb(var(--accent-pink-rgb))',
    'rgb(var(--accent-violet-rgb))',
    'rgb(var(--accent-blue-rgb))',
    'rgb(var(--accent-teal-rgb))',
    'rgb(var(--accent-gold-rgb))',
    'rgb(var(--accent-rose-rgb))',
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <ArrowLink
        href="/"
        dir="back"
        className="link-back inline-flex items-center gap-1.5 text-sm mb-8"
      >
        返回首页
      </ArrowLink>
      <div className="mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4">
          <Hash size={12} />
          标签
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight dark:text-white">
          <span className="text-aurora">全部标签</span>
        </h1>
        <p className="mt-3 text-stone-500 dark:text-gray-500">共 {tags.length} 个标签</p>
      </div>
      <TagList tags={tags} colors={colors} />
    </div>
  );
}
