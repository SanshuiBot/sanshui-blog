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
import AboutContent from '@/components/About/AboutContent';
import { getResumeMarkdown } from '@/lib/resume';

export const metadata: Metadata = {
  title: '关于',
  description: '关于三水个人博客',
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
