'use client';
/**
 * 方案 D 原型：视差拼贴首屏（Parallax Collage）
 * ----------------------------------
 * 卖点：滚动叙事性强，把「往下滚」本身变成体验。Linear、Stripe 风格。
 *
 * 形式：首屏分成 3 个深度层，滚动时各层以不同速度移动，营造「穿越」感：
 *   - 最远层：流光网格 + aurora blob（最慢）
 *   - 中间层：文章卡片缩略图墙（中速，斜向）
 *   - 最近层：标题 / CTA（最快，随 scrollY 平移）
 *
 * 复用：useScroll + useTransform（HeroScene 已有），无新依赖。
 *
 * 降级：prefers-reduced-motion 下各层速度统一为 0，仅保留静态拼贴。
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Mail, ArrowDown } from 'lucide-react';
import Github from '@/components/UI/GithubIcon';
import { usePrefersReducedMotion } from '@/components/UI/usePrefersReducedMotion';
import { siteConfig } from '@/lib/site';
import type { PostIndexEntry } from '@/lib/post-index';
import { getPostsIndex } from '@/lib/posts-index-cache';

export interface HeroStats {
  posts: number;
  tags: number;
  lastUpdated: string;
}

const social = [
  { icon: Github, href: siteConfig.github, label: 'GitHub' },
  { icon: Mail, href: siteConfig.emailHref, label: 'Email' },
];

const lineEase = [0.16, 1, 0.3, 1] as const;

// 拼贴卡片缩略图墙：运行时从 posts-index.json 取最新 6 篇，accent 按索引循环分配
interface Thumb {
  title: string;
  tag: string;
  accent: string; // accent 通道变量名
}
const thumbAccents = [
  '--accent-violet-rgb',
  '--accent-pink-rgb',
  '--accent-blue-rgb',
  '--accent-teal-rgb',
  '--accent-gold-rgb',
  '--accent-rose-rgb',
];

// 中央内容各组退场 opacity 窗口（vh 倍率）：起点依次后移形成「逐层退场」节奏，
// badge 最先退场、CTA 最后消失（行动点留最久）。终点全部 ≤1，保证滚动一屏后
// 首屏内容必然全部隐藏——「滚动后首屏必须消失」是功能性契约（#43），
// 由 tests/hero-parallax-exit.test.ts 锁定，勿随意改动。
export const EXIT_STAGGER = {
  badge: [0, 0.5],
  title: [0.05, 0.9],
  subtitle: [0.15, 0.85],
  stats: [0.22, 0.95],
  cta: [0.3, 1],
} as const;

export default function HeroParallax({ stats }: { stats?: HeroStats }) {
  // reduced-motion：首屏视差/入场全是 JS 驱动（Framer），全局 CSS 0.01ms 压制管不到，
  // 必须组件内自检（AGENTS.md #32）。reduced 时跳过**装饰性**视差 transform 与入场动画；
  // 但「滚动淡出首屏内容」（titleOpacity / scrollHintOpacity）是功能性行为，
  // 必须保留——否则滚动后首屏文字永远不消失（此前 bug 根因）。
  const reduced = usePrefersReducedMotion();
  const [vh, setVh] = useState(800);
  const [w, setW] = useState(1024);
  useEffect(() => {
    // Hero 区有独立的流光网格（56px），添加 marker 让全局网格（64px）隐藏，避免两层叠加产生摩尔纹
    document.documentElement.classList.add('sanshui-hero-active');
    const update = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      setVh(h);
      setW(w);
      // 写入 CSS 变量供占位 div 使用（解决移动端 Safari 100dvh 随地址栏显隐动态变化的问题：
      // 用 JS 快照统一 Hero 退场阈值和占位高度，避免两者不同步导致首屏内容重叠）
      document.documentElement.style.setProperty('--sansui-hero-vh', `${h}px`);
    };
    update();
    // 只监听 resize：旋转时 orientationchange 先于视口重排触发、读到的是旋转前旧尺寸，
    // 且现代浏览器旋转必然补发 resize（可能连发多次，末次才收敛到最终尺寸）。
    // update() 整体覆写、后写胜出，中间过渡值会被末次收敛值覆盖自愈；
    // 去掉 orientationchange 即去掉「必写旧值 + 全量重渲染」那次重复 update。
    window.addEventListener('resize', update);
    return () => {
      document.documentElement.classList.remove('sanshui-hero-active');
      window.removeEventListener('resize', update);
      document.documentElement.style.removeProperty('--sansui-hero-vh');
    };
  }, []);

  const { scrollY } = useScroll();

  // 中央内容退场（A+C 组合）：慢速飘走 + 逐块错峰
  //  - 容器共享 y 上浮（退场窗口 0→1vh，比原 0.6vh 拉长，滚动时「慢慢隐去」）
  //  - 各组 opacity 按从上到下错峰淡出（badge 先走 → CTA 最后消失，行动点留最久）
  // 不在此容器上做 filter blur 失焦：blur(0px) 也是非 none filter，会使容器成为
  // backdrop root，压平内部 .glass 元素的 backdrop-filter（玻璃失效，code review P2）；
  // 且滚动时每帧对整块 text-8xl 标题层重栅格化，低端设备掉帧（P3）。
  // opacity 全部套 useSpring 阻尼——快速滚动时浏览器平滑滚动的惯性会让 scrollY
  // 冲过区间终点后回弹，raw 值会瞬时跳变「0→正值→0」导致内容闪现；
  // spring 平滑收敛，回弹跳变被吸收为不可见的极小值。容器 y 是装饰性
  // （reduced 时跳过，#32/#43），opacity 是功能性（reduced 也保留）。
  const springSmooth = { stiffness: 120, damping: 20, restDelta: 0.001 };
  const exitY = useSpring(useTransform(scrollY, [0, vh], [0, -110]), springSmooth);
  // 各组 opacity 错峰窗口来自 EXIT_STAGGER（vh 倍率 → 像素区间）
  const badgeOpacity = useSpring(
    useTransform(scrollY, [EXIT_STAGGER.badge[0] * vh, EXIT_STAGGER.badge[1] * vh], [1, 0]),
    springSmooth,
  );
  const titleOpacity = useSpring(
    useTransform(scrollY, [EXIT_STAGGER.title[0] * vh, EXIT_STAGGER.title[1] * vh], [1, 0]),
    springSmooth,
  );
  const subtitleOpacity = useSpring(
    useTransform(scrollY, [EXIT_STAGGER.subtitle[0] * vh, EXIT_STAGGER.subtitle[1] * vh], [1, 0]),
    springSmooth,
  );
  const statsOpacity = useSpring(
    useTransform(scrollY, [EXIT_STAGGER.stats[0] * vh, EXIT_STAGGER.stats[1] * vh], [1, 0]),
    springSmooth,
  );
  const ctaOpacity = useSpring(
    useTransform(scrollY, [EXIT_STAGGER.cta[0] * vh, EXIT_STAGGER.cta[1] * vh], [1, 0]),
    springSmooth,
  );

  // 中间层（缩略图墙）：中速向上飘 + 活微旋转
  // 套 spring（高 stiffness + 高 damping）：吸收手机端慢滚时 scrollY 的亚像素抖动，
  // 同时参数够「硬」保持跟手、无延迟感。
  const midY = useSpring(useTransform(scrollY, [0, vh], [0, -180]), {
    stiffness: 400,
    damping: 40,
    restDelta: 0.001,
  });
  const midRotate = useSpring(useTransform(scrollY, [0, vh], [0, -4]), {
    stiffness: 400,
    damping: 40,
    restDelta: 0.001,
  });

  // 最远层（网格背景）：极慢漂移
  // 同样套 spring 吸收抖动；远层位移量小，spring 延迟不可见。
  const farY = useSpring(useTransform(scrollY, [0, vh], [0, 40]), {
    stiffness: 400,
    damping: 40,
    restDelta: 0.001,
  });

  // 向下滚动提示：用户一开始滚（前 15vh）就快速淡出
  const scrollHintOpacity = useTransform(scrollY, [0, vh * 0.15], [1, 0]);

  // CTA 跟手
  const btnRef = useRef<HTMLAnchorElement>(null);
  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);
  const sBtnX = useSpring(btnX, { stiffness: 200, damping: 18 });
  const sBtnY = useSpring(btnY, { stiffness: 200, damping: 18 });
  const onBtnMove = (e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    btnX.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 10);
    btnY.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 10);
  };

  const statItems = stats
    ? [
        { label: '文章', value: stats.posts },
        { label: '标签', value: stats.tags },
        { label: '最近更新', value: stats.lastUpdated },
      ]
    : [];

  // 运行时 fetch posts-index.json，按 date 倒序取最新 6 篇做拼贴墙
  // 使用共享缓存：与 PostsList / SearchModal 共用同一 Promise
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  useEffect(() => {
    let cancelled = false;
    getPostsIndex()
      .then((data: PostIndexEntry[]) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => (a.date < b.date ? 1 : -1));
        const top6 = sorted.slice(0, 6);
        setThumbs(
          top6.map((p, i) => ({
            title: p.title,
            tag: p.tags[0] ?? '未分类',
            accent: thumbAccents[i % thumbAccents.length]!,
          })),
        );
      })
      .catch(() => {
        // 静默失败：thumbs 为空时拼贴墙不渲染，不影响其余层
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 拼贴卡片位置：根据视口宽度动态计算，避免移动端重叠
  // desktop: 分散在较大区域；mobile: 紧凑排列 + 更小 scale
  const positions = useMemo(() => {
    const isMobile = w < 640;
    return thumbs.map((_, i) => {
      if (!isMobile) {
        // 桌面端：沿用原有分布公式
        const baseLeft = ((i * 17 + 8) % 80) + 10;
        const baseTop = ((i * 23 + 12) % 70) + 10;
        // card 5 原位置压在按钮下方，移至右下避免遮挡
        const left = i === 5 ? 75 : baseLeft;
        const top = i === 5 ? 75 : baseTop;
        return {
          left: `${left}%`,
          top: `${top}%`,
          rotate: `${(i % 2 === 0 ? 1 : -1) * (3 + (i % 4))}deg`,
          scale: 0.7 + (i % 3) * 0.08,
        };
      }
      // 移动端：2列3行紧凑排列，确保不重叠
      // scale=0.55，卡片实际约 97×123px，在 375px 视口内居中分布
      // 列：左25%、右75%；行：top 22%、50%、78%（等分视口）
      const colPositions = [25, 75];
      const rowPositions = [22, 50, 78];
      return {
        left: `${colPositions[i % 2]!}%`,
        top: `${rowPositions[Math.floor(i / 2)]!}%`,
        rotate: `${(i % 3 === 0 ? 1 : -1) * (9 + i)}deg`,
        scale: 0.55,
      };
    });
  }, [thumbs, w]);

  return (
    <motion.section className="fixed inset-0 flex items-center justify-center overflow-hidden z-0 will-change-transform">
      {/* ── 最远层：流光网格 + aurora blob ── */}
      <motion.div
        style={reduced ? undefined : { y: farY }}
        className="absolute inset-[-10%] will-change-transform"
      >
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full bg-accent-violet/15 blur-[150px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-accent-pink/12 blur-[130px] animate-float-delayed pointer-events-none" />
        <div aria-hidden className="absolute inset-0 hero-aurora-grid" />
      </motion.div>

      {/* ── 中间层：文章缩略图拼贴墙 ── */}
      <motion.div
        style={reduced ? undefined : { y: midY, rotate: midRotate }}
        className="absolute inset-0 pointer-events-none will-change-transform hero-thumb-wall"
        aria-hidden
      >
        {thumbs.map((t, i) => {
          const pos = positions[i];
          if (!pos) return null;
          return (
            <div
              key={i}
              className="absolute w-44 h-56 rounded-xl glass overflow-hidden shadow-soft hero-thumb-card"
              style={{
                left: pos.left,
                top: pos.top,
                transform: `translate(-50%, -50%) rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: 0.3,
              }}
            >
              {/* 封面渐变 */}
              <div
                className="h-24 w-full"
                style={{
                  background: `linear-gradient(135deg, rgb(var(${t.accent}) / 0.4), rgb(var(${t.accent}) / 0.05))`,
                }}
              />
              {/* 文字 */}
              <div className="p-3">
                <div className="text-[10px] font-mono text-stone-500/40 dark:text-fg/25 mb-1">
                  {t.tag}
                </div>
                <div className="text-xs font-semibold text-stone-400/70 dark:text-fg/20 leading-snug line-clamp-3">
                  {t.title}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── 最近层：标题 / CTA（中央，视差最快） ── */}
      {/* 退场（A+C 组合）：容器共享 y 上浮，滚动时内容「慢慢隐去」；
          各组 opacity 错峰淡出是功能性（滚动后首屏必须隐藏），reduced 也不例外；
          y 是装饰性视差，reduced 时跳过（#32/#43） */}
      <motion.div
        style={reduced ? undefined : { y: exitY }}
        className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center will-change-transform"
      >
        {/* 身份徽章（错峰组 1：最先退场） */}
        <motion.div style={{ opacity: badgeOpacity }}>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: lineEase }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass hero-badge mb-8"
          >
            <span className="hero-badge-dot" aria-hidden />
            <span className="text-xs font-medium text-stone-700 tracking-wide dark:text-gray-300">
              Creative Developer · 技术博客
            </span>
          </motion.div>
        </motion.div>

        {/* Title（错峰组 2） */}
        <motion.div style={{ opacity: titleOpacity }}>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <motion.span
              initial={reduced ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.05, ease: lineEase }}
              className="block text-stone-900 dark:text-fg"
            >
              你好，我是
            </motion.span>
            <motion.span
              initial={reduced ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.18, ease: lineEase }}
              className="block mt-3 text-aurora hero-name-shimmer"
            >
              {siteConfig.name}
            </motion.span>
          </h1>
        </motion.div>

        {/* Subtitle（错峰组 3） */}
        <motion.div style={{ opacity: subtitleOpacity }}>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto mb-8 leading-relaxed dark:text-gray-400"
          >
            用文字沉淀知识，用代码改变世界。
          </motion.p>
        </motion.div>

        {/* Stats（错峰组 4）— 极简 inline 行：数字（单色 accent）· 标签，点分隔 */}
        {statItems.length > 0 && (
          <motion.div style={{ opacity: statsOpacity }}>
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.56 }}
              className="hero-stats-inline mb-10"
            >
              {statItems.map((s, i) => {
                const accents = [
                  'var(--accent-violet-rgb)',
                  'var(--accent-pink-rgb)',
                  'var(--accent-blue-rgb)',
                ];
                const accent = accents[i % accents.length];
                return (
                  <span key={s.label} className="hero-stat-inline-item">
                    {i > 0 && (
                      <span className="hero-stat-sep" aria-hidden>
                        ·
                      </span>
                    )}
                    <span
                      className="hero-stat-inline-num"
                      style={{ color: `rgb(${accent} / 0.95)` }}
                    >
                      {s.value}
                    </span>
                    <span className="hero-stat-inline-label">{s.label}</span>
                  </span>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* CTA + Social（错峰组 5：最后退场，行动点留最久） */}
        <motion.div style={{ opacity: ctaOpacity }}>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.48 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            <motion.a
              ref={btnRef}
              href="#posts"
              onMouseMove={onBtnMove}
              onMouseLeave={() => {
                btnX.set(0);
                btnY.set(0);
              }}
              style={reduced ? undefined : { x: sBtnX, y: sBtnY }}
              className="relative inline-flex items-center gap-3 px-7 py-3 rounded-full hero-cta"
            >
              <span className="hero-cta-glow" />
              <span className="hero-cta-text relative z-10 font-semibold text-sm">浏览文章</span>
              <ArrowDown size={15} className="relative z-10 hero-cta-arrow" />
            </motion.a>
            {social.map(({ icon: Icon, href, label }, idx) => (
              <motion.a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={label}
                className="block p-3 rounded-full glass hero-social text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-fg"
                initial={reduced ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.08, type: 'spring', stiffness: 200 }}
              >
                <Icon size={18} />
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      {/* Scroll indicator：淡出（前 15vh 归零）是功能性行为，reduced 也保留 */}
      <motion.div
        style={{ opacity: scrollHintOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-stone-500 pointer-events-none select-none dark:text-gray-500"
        aria-hidden
      >
        <span className="hero-scroll-label text-[10px] font-medium opacity-60">向下滚动</span>
        <motion.span
          aria-hidden
          className="hero-scroll-arrow"
          animate={reduced ? { opacity: 0.5 } : { y: [-4, 6, -4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={16} />
        </motion.span>
      </motion.div>
    </motion.section>
  );
}
