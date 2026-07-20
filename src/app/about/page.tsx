'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Code2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

const EASE = [0.16, 1, 0.3, 1] as const;

const skills = [
  { label: 'Next.js', level: 90 },
  { label: 'React', level: 92 },
  { label: 'TypeScript', level: 85 },
  { label: 'Tailwind CSS', level: 95 },
  { label: 'Node.js', level: 80 },
  { label: 'Python', level: 70 },
];

const stack = [
  { title: '前端', items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'framer-motion'] },
  { title: '后端', items: ['Node.js', 'Python', 'SQLite', 'REST API'] },
  { title: '工具', items: ['Git', 'Docker', 'VS Code', 'Vite'] },
];

export default function AboutPage() {
  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up" delay={0.05}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>
      </ScrollReveal>

      {/* Hero header */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="relative mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
            <Sparkles size={12} />
            关于
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: EASE, duration: 0.6 }}
            style={{ viewTransitionName: 'page-title' }}
            className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance"
          >
            你好，我是<span className="gradient-text"> 三水</span> 👋
          </motion.h1>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.15}>
        <div className="prose-custom space-y-6">
          <p>
            一个热爱技术和写作的人. 我相信写作是最好的学习方式——通过输出可以加深对知识的理解和记忆，也能遇见志同道合的朋友.
          </p>
          <p>
            这个博客是我记录学习过程、分享技术心得和生活感悟的地方. 所有内容均用 Next.js + MDX 构建，托管在 GitHub Pages 上.
          </p>
        </div>
      </ScrollReveal>

      {/* Skills with animated bars */}
      <ScrollReveal direction="up" delay={0.2}>
        <div className="mt-16">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-6">技能</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {skills.map((skill, i) => (
              <motion.div
                key={skill.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, ease: EASE, duration: 0.4 }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-stone-700 dark:text-stone-300">{skill.label}</span>
                  <span className="text-stone-400">{skill.level}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.8, ease: EASE }}
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-400"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Tech stack grid */}
      <ScrollReveal direction="up" delay={0.25}>
        <div className="mt-16">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-6">技术栈</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stack.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, ease: EASE, duration: 0.5 }}
                className="p-5 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur border border-stone-200/60 dark:border-stone-800/60 hover:shadow-md transition-shadow"
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3 uppercase tracking-widest">
                  {s.title}
                </h3>
                <ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Contact CTA */}
      <ScrollReveal direction="up" delay={0.3}>
        <div className="mt-16 p-8 rounded-3xl gradient-border-soft relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.4), transparent 70%)' }}
          />
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-3 relative">联系我</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6 relative text-pretty">
            如果你有任何问题或想法，欢迎通过以下方式联系我.
          </p>
          <div className="flex flex-wrap gap-3 relative">
            <a
              href="https://github.com/SanshuiBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform"
            >
              <Code2 size={16} />
              GitHub
            </a>
            <a
              href="mailto:localhost6@foxmail.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform"
            >
              <Mail size={16} />
              Email
            </a>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
