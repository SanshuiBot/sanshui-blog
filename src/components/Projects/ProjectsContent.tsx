/**
 * 项目页内容组件（ProjectsContent）
 * -----------------------------
 * 作用：GitHub 仓库卡片墙，md 以上两列统一尺寸网格，鼠标跟随光晕。
 *
 * 设计语言：
 *   - 所有卡片统一尺寸与样式，左侧竖线随机色 + 主题色混合（每卡各不相同）
 *   - hover 光晕随鼠标位置移动（--mx/--my 驱动，语言色径向渐变 + 描边发光）
 *   - 全部 hover 动效纯 CSS（红线 #25/#32，自动合规 prefers-reduced-motion）
 *   - 元信息行：语言圆点 ● / star · fork · 标签
 *   - 入场交错淡入（framer-motion viewport trigger）
 */
'use client';
import {
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Star, GitFork, ExternalLink } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import ArrowLink from '@/components/UI/ArrowLink';
import Github from '@/components/UI/GithubIcon';
import { siteConfig } from '@/lib/site';
import { projects } from '@/lib/projects';
import type { Project } from '@/lib/projects';
import '@/styles/projects.css';

// ── 项目语言色盘 ──────────────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  Vue: '#42b883',
  Svelte: '#ff3e00',
  CSS3: '#563d7c',
};

// ── 入场变体 ──────────────────────────────────────────────────────────────────
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

// ── 竖线随机色池（按项目 URL 哈希取色，每卡各不相同且 hydration 稳定） ─────────
const BAR_COLORS = [
  '#3178c6',
  '#f1e05a',
  '#3572a5',
  '#b07219',
  '#00add8',
  '#dea584',
  '#f34b7d',
  '#42b883',
  '#ff3e00',
  '#563d7c',
  '#a855f7',
  '#ff6ec7',
  '#38bdf8',
  '#2dd4bf',
  '#fbbf36',
];

/** 确定性哈希：同一 URL 恒得同一色（纯函数，避免渲染期随机触发 react-hooks/purity） */
function hashBarColor(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) >>> 0;
  }
  return BAR_COLORS[h % BAR_COLORS.length]!;
}

// ── 仓库卡片 ──────────────────────────────────────────────────────────────────
// 统一尺寸卡片：语言色光晕背景 + hover 纯 CSS 微展开。
// 左侧竖线颜色按 URL 哈希取（视觉随机）+ 主题色 color-mix 混合，每卡各不相同。
function RepoCard({ project }: { project: Project }) {
  const langColor = project.lang ? LANG_COLORS[project.lang] : 'rgb(var(--accent-violet-rgb))';
  // 竖线色：URL 哈希确定，重渲染不变色
  const barColor = hashBarColor(project.url);

  // 鼠标跟随光晕：把光标相对卡片的坐标写入 --mx/--my，光晕层随鼠标移动（纯 CSS 动画）
  const handleMouseMove = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };
  // 鼠标离开：复位到中心，光晕淡出
  const handleMouseLeave = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.setProperty('--mx', '50%');
    e.currentTarget.style.setProperty('--my', '50%');
  };

  return (
    <motion.a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      variants={item}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-xl border border-black/[0.08] bg-black/[0.02] overflow-hidden
                  transition-all duration-500 ease-out hover:scale-[1.01] hover:border-black/[0.16]
                  hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                  dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12]
                  dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
    >
      {/* hover 光晕：背景光晕 + 边框发光（语言色，纯 CSS 淡入，红线 #25/#32） */}
      <div
        className="project-card-glow"
        style={
          {
            '--project-glow': `${langColor}2e`,
            '--project-border-glow': `${langColor}59`,
          } as CSSProperties
        }
        aria-hidden="true"
      />
      <div
        className="project-card-border-glow"
        style={{ '--project-border-glow': `${langColor}59` } as CSSProperties}
        aria-hidden="true"
      />

      {/* 左侧竖线：随机色 + 主题色混合（color-mix），每卡各不相同 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${barColor} 55%, rgb(var(--accent-violet-rgb))), color-mix(in srgb, ${barColor} 12%, rgb(var(--accent-violet-rgb) / 0.4)))`,
        }}
      />

      <div className="relative p-5 pl-6">
        {/* 文字信息区 */}
        <div className="flex-1 min-w-0">
          {/* 头部：名称 + 外链图标 */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="project-card-title font-semibold leading-snug text-base"
              style={{ '--project-lang': langColor } as CSSProperties}
            >
              {project.name}
            </h3>
            <ExternalLink
              size={14}
              className="shrink-0 text-black/25 transition-all duration-300
                         group-hover:text-black/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                         dark:text-white/10 dark:group-hover:text-white/50"
              aria-hidden="true"
            />
          </div>

          {/* 描述 */}
          <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2 dark:text-gray-500">
            {project.desc}
          </p>

          {/* 元信息行 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-700 dark:text-gray-600">
            {project.lang && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: langColor, boxShadow: `0 0 5px ${langColor}99` }}
                  aria-hidden="true"
                />
                <span
                  className="project-lang-text"
                  style={{ '--project-lang': langColor } as CSSProperties}
                >
                  {project.lang}
                </span>
              </span>
            )}
            {project.stars !== undefined && project.stars > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400/60" />
                <span>{project.stars}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <GitFork size={12} className="text-gray-600 dark:text-gray-700" />
              <span>–</span>
            </span>
          </div>

          {/* 标签行 */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[0.625rem] font-mono
                             bg-black/[0.04] text-gray-600 border border-black/[0.08]
                             transition-colors group-hover:border-black/[0.16] group-hover:text-gray-900
                             dark:bg-white/5 dark:text-gray-500 dark:border-white/[0.06]
                             dark:group-hover:border-white/[0.12] dark:group-hover:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.a>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function ProjectsContent() {
  // hydration 完成检测：客户端快照 true、SSR 快照 false（替代 mounted effect，避免 setState-in-effect）
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
      <ArrowLink
        href="/"
        dir="back"
        className="link-back inline-flex items-center gap-1.5 text-sm mb-8"
      >
        返回首页
      </ArrowLink>

      {/* 页面标题 */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-teal uppercase tracking-widest mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.25 1.2-.25 1.8v3" />
            <path d="M6 13H3a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h1" />
            <path d="M9 22v-3H6" />
          </svg>
          项目
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          <span
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--accent-pink-rgb)), rgb(var(--accent-violet-rgb)) 30%, rgb(var(--accent-blue-rgb)) 60%, rgb(var(--accent-teal-rgb)) 80%, rgb(var(--accent-gold-rgb)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '300% 300%',
              animation: 'aurora-shift 8s ease-in-out infinite',
            }}
          >
            开源项目
          </span>
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-500">
          托管在{' '}
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-accent-violet underline underline-offset-2 transition-colors dark:text-gray-400"
          >
            GitHub
          </a>{' '}
          上
        </p>
      </div>

      {/* Bento 网格：首卡 featured 跨双列，其余单列（窄屏全部单列） */}
      <motion.div
        variants={container}
        initial="hidden"
        animate={mounted ? 'show' : 'hidden'}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {projects.map((project) => (
          <RepoCard key={project.url} project={project} />
        ))}
      </motion.div>

      {/* 底部 CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 8 }}
        transition={{ delay: 0.45, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-500"
      >
        <span>更多项目欢迎去 GitHub 逛逛</span>
        <a
          href={siteConfig.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-black/10 bg-black/[0.04] text-gray-600 hover:text-black hover:border-black/20 transition-colors font-mono text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white dark:hover:border-white/20"
        >
          <Github size={14} />
          查看全部项目
        </a>
      </motion.div>
    </>
  );
}
