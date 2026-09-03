'use client';
import { Mail, Sparkles, Code2, Server, Wrench, Terminal, Braces, Layers, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiFramer,
  SiNodedotjs,
  SiPython,
  SiSqlite,
  SiGit,
  SiDocker,
  SiVite,
} from 'react-icons/si';
import { TbBrandVscode } from 'react-icons/tb';
import Github from '@/components/UI/GithubIcon';
import ArrowLink from '@/components/UI/ArrowLink';
import { motion, type Variants } from 'framer-motion';
import ResumeTerminal from './ResumeTerminal';
import { siteConfig } from '@/lib/site';

const skills = [
  { label: 'Next.js', level: 90, color: 'from-accent-pink to-accent-rose' },
  { label: 'React', level: 92, color: 'from-accent-violet to-accent-pink' },
  { label: 'TypeScript', level: 85, color: 'from-accent-blue to-accent-violet' },
  { label: 'Tailwind CSS', level: 95, color: 'from-accent-teal to-accent-blue' },
  { label: 'Node.js', level: 80, color: 'from-accent-gold to-accent-rose' },
  { label: 'Python', level: 70, color: 'from-accent-violet to-accent-blue' },
];

const stack = [
  {
    title: '前端',
    icon: Code2,
    items: [
      { name: 'Next.js', level: 5 },
      { name: 'React', level: 5 },
      { name: 'TypeScript', level: 4 },
      { name: 'Tailwind CSS', level: 5 },
      { name: 'Framer Motion', level: 4 },
    ],
    color: 'from-accent-pink to-accent-rose',
  },
  {
    title: '后端',
    icon: Server,
    items: [
      { name: 'Node.js', level: 4 },
      { name: 'Python', level: 3 },
      { name: 'SQLite', level: 3 },
      { name: 'REST API', level: 4 },
    ],
    color: 'from-accent-violet to-accent-blue',
  },
  {
    title: '工具',
    icon: Wrench,
    items: [
      { name: 'Git', level: 5 },
      { name: 'Docker', level: 3 },
      { name: 'VS Code', level: 5 },
      { name: 'Vite', level: 4 },
    ],
    color: 'from-accent-teal to-accent-gold',
  },
];

/** 技术 logo 映射：品牌色做彩色，无品牌色的（Next.js/REST API）用当前文字色或中性灰 */
const stackIcons: Record<
  string,
  { Icon: ComponentType<{ size?: number; className?: string }>; color?: string }
> = {
  'Next.js': { Icon: SiNextdotjs },
  React: { Icon: SiReact, color: '#61DAFB' },
  TypeScript: { Icon: SiTypescript, color: '#3178C6' },
  'Tailwind CSS': { Icon: SiTailwindcss, color: '#06B6D4' },
  'Framer Motion': { Icon: SiFramer, color: '#0055FF' },
  'Node.js': { Icon: SiNodedotjs, color: '#339933' },
  Python: { Icon: SiPython, color: '#3776AB' },
  SQLite: { Icon: SiSqlite, color: '#003B57' },
  'REST API': { Icon: Braces, color: '#94a3b8' },
  Git: { Icon: SiGit, color: '#F05032' },
  Docker: { Icon: SiDocker, color: '#2496ED' },
  'VS Code': { Icon: TbBrandVscode, color: '#007ACC' },
  Vite: { Icon: SiVite, color: '#646CFF' },
};

const fallbackStackIcon: {
  Icon: ComponentType<{ size?: number; className?: string }>;
  color?: string;
} = {
  Icon: Wrench,
  color: '#94a3b8',
};

const btnClass = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium';

interface AboutContentProps {
  /** 本地简历 markdown，由服务端页面在构建时读取并注入 */
  resumeMarkdown?: string;
}

// ── 入场变体：整页区块自上而下交错浮现（与项目/友链页同款节奏） ──
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export default function AboutContent({ resumeMarkdown }: AboutContentProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <ArrowLink
          href="/"
          dir="back"
          className="link-back inline-flex items-center gap-1.5 text-sm mb-8"
        >
          返回首页
        </ArrowLink>
      </motion.div>
      <motion.div variants={item} className="relative mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-pink uppercase tracking-widest mb-4">
          <Sparkles size={12} />
          关于
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight dark:text-white">
          你好，我是<span className="text-aurora">{siteConfig.name}</span>
        </h1>
      </motion.div>
      <motion.div variants={item} className="prose-article mb-10">
        <p>一个热爱技术和写作的人。用文字沉淀知识，用代码改变世界。</p>
        <p>这个博客由 Next.js + MDX 构建，托管在 GitHub Pages 上。</p>
      </motion.div>

      {/* Skills */}
      <motion.div variants={item} className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={18} className="text-accent-pink" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">技能</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {skills.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-stone-700 dark:text-gray-300">{s.label}</span>
                <span className="text-stone-400 dark:text-gray-600">{s.level}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-black/[0.03] overflow-hidden dark:bg-white/5">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.level}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tech stack cards */}
      <motion.div variants={item} className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Layers size={18} className="text-accent-teal" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">技术栈</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stack.map((s, catIdx) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIdx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="relative flex flex-col p-5 rounded-2xl glass border border-black/[0.06] hover:border-black/20 overflow-hidden group dark:border-white/5 dark:hover:border-white/20"
            >
              <motion.div
                className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${s.color}`}
                initial={{ scaleX: 0, opacity: 0 }}
                whileHover={{ scaleX: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                style={{ transformOrigin: 'left' }}
              />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <s.icon size={15} className="text-stone-500 dark:text-gray-500" />
                  <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-widest dark:text-white">
                    {s.title}
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-stone-400 bg-black/[0.03] px-2 py-0.5 rounded-full dark:bg-white/5 dark:text-gray-600">
                  {s.items.length} 项
                </span>
              </div>
              <div className="flex flex-1 flex-wrap content-start gap-3">
                {s.items.map((item, i) => {
                  const icon = stackIcons[item.name] ?? fallbackStackIcon;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.15 + i * 0.06,
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ y: -2, scale: 1.04 }}
                      className="relative w-full"
                    >
                      <div className="relative px-3 py-2 rounded-lg border border-black/10 bg-black/[0.03] hover:bg-black/[0.06] dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] transition-colors cursor-default">
                        <div className="flex items-center gap-2 pl-2">
                          <span
                            className="shrink-0 leading-none"
                            style={icon.color ? { color: icon.color } : undefined}
                          >
                            <icon.Icon size={12} />
                          </span>
                          <span className="text-sm text-gray-800 dark:text-gray-300">
                            {item.name}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, di) => (
                              <span
                                key={di}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  di < item.level
                                    ? 'bg-gray-700 dark:bg-white/70'
                                    : 'bg-gray-300 dark:bg-white/15'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 流式打印简历 */}
      {resumeMarkdown && resumeMarkdown.trim().length > 0 && (
        <motion.div variants={item} className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Terminal size={18} className="text-accent-violet" />
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">个人简历</h2>
            <span className="ml-auto text-xs text-stone-400 font-mono dark:text-gray-600">
              流式输出
            </span>
          </div>
          <p className="text-stone-500 text-sm mb-5 dark:text-gray-500">
            进入视图后，简历会一行行像终端流式输出般打印出来，直至完整呈现。
          </p>
          <ResumeTerminal source={resumeMarkdown} />
        </motion.div>
      )}

      {/* Contact — 终端命令式 CTA 面板（与友链交换块同款） */}
      <motion.div variants={item} className="terminal-exchange-box">
        <div className="terminal-exchange-title">$ cat contact.md</div>
        <p className="terminal-exchange-desc">如果你有任何问题或想法，欢迎通过以下方式联系我。</p>
        <div className="flex flex-wrap gap-3">
          <motion.a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`${btnClass} btn-solid`}
          >
            <Github size={16} />
            GitHub
          </motion.a>
          <motion.a
            href={siteConfig.emailHref}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`${btnClass} bg-black/[0.03] text-stone-700 border border-black/[0.1] hover:border-accent-violet/40 dark:bg-white/5 dark:text-gray-300 dark:border-white/10`}
          >
            <Mail size={16} />
            Email
          </motion.a>
          <span
            aria-hidden="true"
            title="KFC Crazy Thursday, V 50 —— 玩梗的：点个 Star 或写封邮件就好 ☕"
            className="inline-flex select-none items-center gap-1.5 font-mono text-sm text-gray-600 dark:text-gray-300"
          >
            <span className="text-accent-violet">$</span>
            <span>echo &quot;KFC Crazy Thursday, V 50&quot;</span>
          </span>
        </div>
        <p className="mt-4 font-mono text-xs text-stone-500 dark:text-gray-500">
          # KFC Crazy Thursday, V 50（玩梗的——点个 Star 或写封邮件，就是最好的支持）
        </p>
      </motion.div>
    </motion.div>
  );
}
