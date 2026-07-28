/**
 * 友链页（Links / 友情链接）
 * -----------------------------
 * 作用：展示博主收藏的友情链接（其他博客、资源站点等）。
 *
 * 用法：
 *  - 服务端组件壳，实际内容、交互、卡片样式全部委托给 <LinksContent>。
 *  - metadata 覆盖标题为"友链"。
 *  - 如需新增/修改友链数据，编辑 LinksContent 组件或其引用的数据源即可。
 */
import type { Metadata } from 'next';
import LinksContent from '@/components/Links/LinksContent';

export const metadata: Metadata = {
  title: '友链',
  description: '友情链接',
};

export default function LinksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <LinksContent />
    </div>
  );
}
