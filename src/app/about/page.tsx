'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-10"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-8">
          关于我
        </h1>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2}>
        <div className="prose-custom space-y-6">
          <p>
            你好！我是<strong className="text-stone-900 dark:text-stone-50">三水</strong>
            ，一个热爱技术和写作的人。
          </p>
          <p>
            这个博客是我记录学习过程、分享技术心得和生活感悟的地方。我相信写作是最好的学习方式，
            通过输出可以加深对知识的理解和记忆。
          </p>

          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mt-8 mb-4">技术栈</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>前端：Next.js, React, TypeScript, Tailwind CSS</li>
            <li>后端：Node.js, Python</li>
            <li>工具：Git, Docker, VS Code</li>
          </ul>

          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mt-8 mb-4">
            联系方式
          </h2>
          <p>如果你有任何问题或想法，欢迎通过以下方式联系我：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email: localhost6@foxmail.com</li>
            <li>GitHub: https://github.com/SanshuiBot</li>
          </ul>
        </div>
      </ScrollReveal>
    </div>
  );
}
