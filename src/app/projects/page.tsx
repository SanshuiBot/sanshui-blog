/**
 * 项目页（Projects）
 * -----------------------------
 * 作用：展示博主的 GitHub 项目列表。
 *
 * 用法：
 *  - 服务端组件壳，实际内容、交互、卡片样式全部委托给 <ProjectsContent>。
 *  - metadata 覆盖标题为"项目"。
 *  - 如需新增/修改项目数据，编辑 src/lib/projects.ts 即可。
 */
import type { Metadata } from 'next';
import ProjectsContent from '@/components/Projects/ProjectsContent';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: '项目',
  description: `${siteConfig.name}的GitHub项目列表`,
};

export default function ProjectsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <ProjectsContent />
    </div>
  );
}
