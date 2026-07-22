'use client';

import { ArrowLeft, Mail, Code2, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import GradientText from '@/components/GradientText';
import MorphBlob from '@/components/MorphBlob';
import SparklesComp from '@/components/Sparkles';
import Timeline from '@/components/Timeline';

const skills = [
  { label: 'Next.js', level: 90 },
  { label: 'React', level: 92 },
  { label: 'TypeScript', level: 85 },
  { label: 'Tailwind CSS', level: 95 },
  { label: 'Node.js', level: 80 },
  { label: 'Python', level: 70 },
];

const stack = [
  { title: '前端', items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'framer-motion'], color: 'from-pink-500 to-rose-500' },
  { title: '后端', items: ['Node.js', 'Python', 'SQLite', 'REST API'], color: 'from-violet-500 to-purple-500' },
  { title: '工具', items: ['Git', 'Docker', 'VS Code', 'Vite'], color: 'from-blue-500 to-cyan-500' },
];

const timelineEvents = [
  { year: '2024', title: '博客上线', description: '使用 Next.js + MDX 搭建个人博客，开始记录技术思考。' },
  { year: '2023', title: '全栈探索', description: '深入 Node.js 和 Python，尝试全栈开发。' },
  { year: '2022', title: '前端入门', description: '学习 React 和 TypeScript，开启前端之旅。' },
];

export default function AboutPage() {
  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <ScrollReveal direction="up" delay={0.05}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8 group/back"
        >
          <ArrowLeft size={16} className="transition-transform duration-300 group-hover/back:-translate-x-1" />
          返回首页
        </Link>
      </ScrollReveal>

      {/* Hero header */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="relative mb-12">
          <MorphBlob color="rgba(244, 114, 182, 0.1)" size={350} className="absolute -top-10 -right-10 pointer-events-none" />
          <SparklesComp count={6} className="pointer-events-none" shapes={['dot', 'star']} />

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
            <Sparkles size={12} />
            关于
          </span>
          <h1
            style={{ viewTransitionName: 'page-title' }}
            className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance"
          >
            你好，我是 <GradientText mode="holo" size="lg" glow>三水</GradientText>
          </h1>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.15}>
        <div className="prose-custom space-y-6 relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/5 via-violet-500/5 to-cyan-500/5 dark:from-pink-500/10 dark:via-violet-500/10 dark:to-cyan-500/10 -z-10 blur-xl" />
          <p>
            一个热爱技术和写作的人. 我相信写作是最好的学习方式——通过输出可以加深对知识的理解和记忆，也能遇见志同道合的朋友.
          </p>
          <p>
            这个博客是我记录学习过程、分享技术心得和生活感悟的地方. 所有内容均用 Next.js + MDX 构建，托管在 GitHub Pages 上.
          </p>
        </div>
      </ScrollReveal>

      {/* Skills */}
      <ScrollReveal direction="up" delay={0.2}>
        <div className="mt-16">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-6">技能</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <div key={skill.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-stone-700 dark:text-stone-300">{skill.label}</span>
                  <span className="text-stone-400">{skill.level}%</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500"
                    style={{
                      width: `${skill.level}%`,
                      transition: 'width 0.8s var(--ease-out-expo)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Tech stack */}
      <ScrollReveal direction="up" delay={0.25}>
        <div className="mt-16">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-6">技术栈</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stack.map((s) => (
              <div
                key={s.title}
                className="group/stack relative p-5 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur border border-stone-200/60 dark:border-stone-800/60 hover:shadow-iridescent transition-all duration-700 ease-[var(--ease-out-quint)] overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${s.color} opacity-0 group-hover/stack:opacity-100 transition-opacity duration-500`} />
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3 uppercase tracking-widest">
                  {s.title}
                </h3>
                <ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${s.color}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Timeline */}
      <ScrollReveal direction="up" delay={0.3}>
        <div className="mt-16">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-8">成长轨迹</h2>
          <Timeline events={timelineEvents} />
        </div>
      </ScrollReveal>

      {/* Contact CTA */}
      <ScrollReveal direction="up" delay={0.35}>
        <div className="mt-16 p-8 rounded-3xl double-bezel-outer relative">
          <MorphBlob color="rgba(220, 38, 38, 0.15)" size={200} className="absolute -top-12 -right-12 pointer-events-none" />
          <div className="relative">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-3">联系我</h2>
            <p className="text-stone-600 dark:text-stone-400 mb-6 text-pretty">
              如果你有任何问题或想法，欢迎通过以下方式联系我.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/SanshuiBot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform light-ray"
              >
                <Code2 size={16} />
                GitHub
              </a>
              <a
                href="mailto:localhost6@foxmail.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform light-ray"
              >
                <Mail size={16} />
                Email
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-iridescent"
              >
                <Heart size={16} className="text-pink-500" />
                赞助我
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
