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
