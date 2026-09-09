/**
 * 关于页（About / 个人简历）
 * -----------------------------
 * 作用：展示博主个人介绍与简历。简历原文在构建时从 content/resume.md 读取，
 *       传入客户端组件 AboutContent，由其做终端风格的"流式打印"动画。
 *
 * 用法：
 *  - 服务端组件，getResumeMarkdown() 同步返回 markdown 字符串。
 *  - metadata 单独导出，覆盖根布局的标题为"关于"。
 *  - 实际的渲染、动画、双主题适配都在 <AboutContent> 内完成，本文件只负责取数与布局壳。
 */
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getResumeMarkdown } from '@/lib/resume';
import { siteConfig } from '@/lib/site';

// AboutContent 包含 framer-motion + 终端打字动画 + 技能进度条，是重量级客户端组件。
// dynamic 导入做代码分割：导航到"关于"页时才下载 chunk。
// 注意：Server Component 中不能用 ssr: false，AboutContent 自身已有 'use client'。
const AboutContent = dynamic(() => import('@/components/About/AboutContent'), {
  loading: () => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-24 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
        <div className="h-12 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-black/[0.04] dark:bg-white/[0.04]" />
        <div className="h-4 w-2/3 rounded bg-black/[0.04] dark:bg-white/[0.04]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-black/[0.04] dark:bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: '关于',
  description: `关于${siteConfig.name}个人博客`,
  alternates: { canonical: `${siteConfig.url}/about/` },
};

export default function AboutPage() {
  // 构建时从本地 content/resume.md 读取简历原文，注入客户端组件做流式打印
  const resumeMarkdown = getResumeMarkdown();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <AboutContent resumeMarkdown={resumeMarkdown} />
    </div>
  );
}
