/**
 * 项目页内容组件（ProjectsContent）
 * -----------------------------
 * 作用：GitHub 仓库卡片墙，md 以上两列统一尺寸网格，鼠标跟随光晕。
 *
 * 设计语言（配色收敛版）：
 *   - 所有卡片统一尺寸与样式，顶部渐变条为 accent 循环色 → 透明（每卡按索引循环 5 色）
 *   - hover 光晕随鼠标位置移动（--mx/--my 驱动，与渐变条同源 accent 循环色 + 描边发光）
 *   - 卡片装饰色统一用 accent 循环（顶部渐变条 / 圆点 / hover 光晕同源，index % 5），跟随主题联动
 *   - 标题亮暗双态纯色，hover 联动 accent（纯 CSS，红线 #25/#26/#47）
 *   - 全部 hover 动效纯 CSS（红线 #25/#32，自动合规 prefers-reduced-motion）
 *   - 入场交错淡入（framer-motion viewport trigger）
 */
'use client';
import {
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import ArrowLink from '@/components/UI/ArrowLink';
import GithubIcon from '@/components/UI/GithubIcon';
import { siteConfig } from '@/lib/site';
import { projects } from '@/lib/projects';
import type { Project } from '@/lib/projects';
import '@/styles/projects.css';

// ── 卡片装饰色循环：顶部渐变条 + hover 光晕共用（与 PostCard 标签渐变同语义，index % 5） ──
// 存 rgb(var(--accent-xxx-rgb)) 字符串 → 跟随 AccentPicker 主题联动，不写固定 hex。
const BAR_ACCENTS = [
  'rgb(var(--accent-pink-rgb))',
  'rgb(var(--accent-violet-rgb))',
  'rgb(var(--accent-blue-rgb))',
  'rgb(var(--accent-teal-rgb))',
  'rgb(var(--accent-gold-rgb))',
] as const;

// ── Tag 配色循环：用 tag 字符串做确定性哈希，同名 tag 始终同色，跟随主题联动 ──
function tagAccentHash(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) {
    h = ((h << 5) - h + tag.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % BAR_ACCENTS.length;
}

// ── 入场变体 ──────────────────────────────────────────────────────────────────
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } },
};

// ── 仓库卡片 ──────────────────────────────────────────────────────────────────
// 统一尺寸卡片：accent 循环光晕背景 + hover 纯 CSS 微展开。
function RepoCard({ project, index }: { project: Project; index: number }) {
  // 语言圆点 + 顶部渐变条 + hover 光晕共用同一套 accent（按卡片索引循环）
  const accent = BAR_ACCENTS[index % BAR_ACCENTS.length];

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
      style={{ '--project-accent': accent } as CSSProperties}
      className="group relative rounded-xl border overflow-hidden shadow-soft
                  transition-all duration-500 ease-out
                  dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.18]
                  border-black/[0.06] bg-white/70 hover:border-black/[0.14]
                  backdrop-blur-sm dark:backdrop-blur-md
                  hover:scale-[1.015]"
    >
      {/* hover 光晕：背景光晕 + 边框发光（--project-accent 装饰色，纯 CSS 淡入，红线 #25/#32） */}
      <div className="project-card-glow" aria-hidden="true" />
      <div className="project-card-border-glow" aria-hidden="true" />

      {/* 顶部渐变条：accent 循环色 → 透明，hover 时提亮 */}
      <div className="project-card-bar" aria-hidden="true" />

      <div className="relative p-5 pl-6">
        {/* 文字信息区 */}
        <div className="min-w-0">
          {/* 头部：名称 + 外链图标 */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="project-card-title font-semibold leading-snug text-base">
              {project.name}
            </h3>
            <ExternalLink
              size={14}
              className="shrink-0 text-black/35 transition-all duration-300
                         group-hover:text-black/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                         dark:text-fg/50 dark:group-hover:text-fg"
              aria-hidden="true"
            />
          </div>

          {/* 描述 */}
          <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed mb-4 line-clamp-2">
            {project.desc}
          </p>

          {/* 元信息行：语言圆点（唯一语言色元素）+ 灰阶语言名/star */}
          {(project.lang || (project.stars !== undefined && project.stars > 0)) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-300">
              {project.lang && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                    style={{
                      background: accent!,
                      boxShadow: `0 0 6px ${accent!.replace('))', ') / 0.3)')}`,
                    }}
                    aria-hidden="true"
                  />
                  {project.lang}
                </span>
              )}
              {project.stars !== undefined && project.stars > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-amber-500 dark:text-yellow-400/70" />
                  {project.stars}
                </span>
              )}
            </div>
          )}

          {/* 标签行 */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tags.map((tag) => {
                const tagIdx = tagAccentHash(tag);
                return (
                  <span
                    key={tag}
                    data-accent-idx={tagIdx}
                    className="tag-accent px-2 py-0.5 rounded-full text-[0.6875rem] font-mono
                               transition-all duration-300
                               dark:border-white/[0.2] dark:bg-white/10 dark:text-fg
                               border-black/[0.08] bg-black/[0.04] text-stone-500
                               group-hover:border-transparent"
                  >
                    {tag}
                  </span>
                );
              })}
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
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight dark:text-fg">
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
      </div>

      {/* Bento 网格：首卡 featured 跨双列，其余单列（窄屏全部单列） */}
      <motion.div
        variants={container}
        initial="hidden"
        animate={mounted ? 'show' : 'hidden'}
        className="projects-content grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {projects.map((project, index) => (
          <RepoCard key={project.url} project={project} index={index} />
        ))}
      </motion.div>

      {/* 底部 CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 8 }}
        transition={{ delay: 0.12, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-500"
      >
        <span>更多项目欢迎去 GitHub 逛逛</span>
        <a
          href={siteConfig.github}
          target="_blank"
          rel="noopener noreferrer"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--mx', '0px');
            e.currentTarget.style.setProperty('--my', '-40px');
          }}
          className="cta-ghost-btn relative overflow-hidden rounded-lg
                     transition-all duration-300 ease-out
                     hover:-translate-y-0.5"
          style={{ '--mx': '0px', '--my': '-40px' } as CSSProperties}
        >
          {/* 鼠标跟随光晕 */}
          <span className="cta-ghost-glow" aria-hidden="true" />
          {/* 内容：图标 + 文字 + 箭头 */}
          <span className="relative flex items-center gap-1.5 px-4 py-2 font-mono text-sm">
            <GithubIcon size={13} className="shrink-0" />
            <span>查看全部项目</span>
            <svg
              className="cta-ghost-arrow shrink-0 transition-all duration-300"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 9L9 4" />
              <path d="M4 4h5v5" />
            </svg>
          </span>
        </a>
      </motion.div>
    </>
  );
}
