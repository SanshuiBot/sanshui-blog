'use client';
/**
 * 首屏 Hero：固定背景视差 + 前景真实滚出
 * ----------------------------------
 * 层次（背景 fixed，前景回归文档流）：
 *   - 背景层（fixed inset-0 z-0）：流光网格 + aurora blob + 缩略图墙，
 *     随 scrollY 以不同速度漂移，滚动全程提供纵深氛围。
 *   - 前景层（relative z-10，在文档流内）：标题 / CTA 随滚动被后续内容
 *     物理顶出视口。退场不再由 JS 把 scrollY 映射成 opacity/y 模拟——
 *     旧 EXIT_STAGGER 方案淡出窗口长，慢滚时文字长时间半透明（鬼影），
 *     且内容原地漂移与滚动手势脱钩。「滚动后首屏消失」（AGENTS.md #43）
 *     现在由物理滚动天然满足，reduced-motion 无需为退场做任何处理。
 *
 * 复用：useScroll + useTransform（仅背景视差），无新依赖。
 * 降级：prefers-reduced-motion 下背景层速度统一为 0，仅保留静态拼贴。
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

// 前景退场润色窗口（vh 倍率）：物理滚出为主，淡出 + 轻微收缩（scale→0.94）
// 叠加在 0.2→0.85vh 的滚动区段——内容跟随滚动移动，半透明不会产生旧方案
// 「原地淡出的鬼影」，因此窗口可以放得足够早，让润色全程肉眼可见
// （旧 EXIT_STAGGER 的教训是窗口太长且内容原地不动；这里内容在动，性质不同）。
// 由 tests/hero-parallax-exit.test.tsx 锁定不变式，勿随意改动。
export const EXIT_FADE = { start: 0.2, end: 0.85, scale: 0.94 } as const;

// opacity 平滑参数（同旧方案教训）：快速滚动时浏览器惯性会让 scrollY 冲过窗口
// 终点后回弹，raw 值瞬时跳变会闪现内容；spring 收敛把回弹吸收为不可见极小值。
const springSmooth = { stiffness: 120, damping: 20, restDelta: 0.001 };

export default function HeroParallax({ stats }: { stats?: HeroStats }) {
  // reduced-motion：首屏视差/入场全是 JS 驱动（Framer），全局 CSS 0.01ms 压制管不到，
  // 必须组件内自检（AGENTS.md #32）。reduced 时跳过背景视差 transform 与入场动画；
  // 前景退场是物理滚动，不需要任何 reduced 特判。
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
      // 写入 CSS 变量供 loading 占位 / 前景 min-height 使用（解决移动端 Safari 100dvh
      // 随地址栏显隐动态变化的问题：用 JS 快照统一高度，避免内容与视口不同步）
      document.documentElement.style.setProperty('--sansui-hero-vh', `${h}px`);
    };
    update();
    // 只监听 resize：旋转时 orientationchange 先于视口重排触发、读到的是旋转前旧尺寸，
    // 且现代浏览器旋转必然补发 resize（可能连发多次，末次才收敛到最终尺寸）。
    // update() 整体覆写、后写胜出，中间过渡值会被末次收敛值覆盖自愈。
    window.addEventListener('resize', update);
    return () => {
      document.documentElement.classList.remove('sanshui-hero-active');
      window.removeEventListener('resize', update);
      document.documentElement.style.removeProperty('--sansui-hero-vh');
    };
  }, []);

  const { scrollY } = useScroll();

  // 背景层视差（装饰性，reduced 时跳过）
  // 中间层（缩略图墙）：中速向上飘 + 微旋转。
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

  // 最远层（网格背景）：极慢漂移。远层位移量小，spring 延迟不可见。
  const farY = useSpring(useTransform(scrollY, [0, vh], [0, 40]), {
    stiffness: 400,
    damping: 40,
    restDelta: 0.001,
  });

  // 前景退场润色（装饰性，reduced 时跳过）：在 EXIT_FADE 窗口（0.2→0.85vh）内
  // 淡出 + 轻微收缩，窗口外恒为 1/不缩放；内容随滚动移动，半透明无鬼影
  // （契约见 EXIT_FADE 注释与 hero-parallax-exit 测试）。
  const exitOpacity = useSpring(
    useTransform(scrollY, [EXIT_FADE.start * vh, EXIT_FADE.end * vh], [1, 0]),
    springSmooth,
  );
  const exitScale = useSpring(
    useTransform(scrollY, [EXIT_FADE.start * vh, EXIT_FADE.end * vh], [1, EXIT_FADE.scale]),
    springSmooth,
  );

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
    btnX.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 4);
    btnY.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 4);
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
    <>
      {/* ── 背景层：fixed，滚动全程驻留提供氛围（纯装饰）── */}
      <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
        {/* 最远层：流光网格 + aurora blob */}
        <motion.div
          style={reduced ? undefined : { y: farY }}
          className="absolute inset-[-10%] will-change-transform"
        >
          <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full bg-accent-violet/15 blur-[150px] animate-float pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-accent-pink/12 blur-[130px] animate-float-delayed pointer-events-none" />
          <div className="absolute inset-0 hero-aurora-grid" />
        </motion.div>

        {/* 中间层：文章缩略图拼贴墙 */}
        <motion.div
          style={reduced ? undefined : { y: midY, rotate: midRotate }}
          className="absolute inset-0 pointer-events-none will-change-transform hero-thumb-wall"
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
      </div>

      {/* ── 前景层：文档流内，随滚动被后续内容物理顶出视口 ──
          退场 = 物理滚出为主 + 最后一段（EXIT_FADE）短促淡出/收缩润色；
          opacity 是装饰性润色，reduced 时跳过（#32/#43——物理滚出已保证首屏消失）。
          scale 走 CSS 独立 scale 属性（motion.div 的 style.scale 映射到该属性），
          与 framer inline transform 不冲突（AGENTS.md #42）。
          高度用 --sansui-hero-vh 快照（非 100dvh），规避移动端地址栏显隐抖动。
          opacity/scale 以 MotionValue 传入 style，framer 渲染进 transform 矩阵，
          不产生独立 CSS scale 属性；与内部元素的 inline transform 无冲突。
          前景不加 will-change：opacity 仅在 EXIT_FADE 窗口内短时动画，常驻合成层
          不划算（低端设备掉帧）；窗口内短暂参与合成可接受。 */}
      <motion.section
        style={reduced ? undefined : { opacity: exitOpacity, scale: exitScale }}
        className="relative z-10 flex min-h-[var(--sansui-hero-vh,100dvh)] items-center justify-center"
      >
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* 身份徽章 */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: lineEase }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass hero-badge mb-8"
          >
            <span className="hero-badge-dot" aria-hidden />
            <span className="text-xs font-medium text-stone-700 tracking-wide dark:text-gray-300">
              Engineer &amp; Writer · 实战与踩坑
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <motion.span
              initial={reduced ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.05, ease: lineEase }}
              className="block text-stone-900 dark:text-fg"
            >
              工程师 · 写作者
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

          {/* Subtitle */}
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto mb-8 leading-relaxed dark:text-gray-400"
          >
            构建有细节的界面，写下有温度的记录。
          </motion.p>

          {/* Stats — 极简 inline 行：数字（单色 accent）· 标签，点分隔 */}
          {statItems.length > 0 && (
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
          )}

          {/* CTA + Social */}
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
              <ArrowDown size={15} className="relative z-10" />
            </motion.a>
            {social.map(({ icon: Icon, href, label }, idx) => (
              <motion.a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={label}
                className="block p-3 rounded-full glass hero-social text-stone-600 dark:text-gray-400"
                initial={reduced ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.08, type: 'spring', stiffness: 200 }}
              >
                <Icon size={18} />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator：随前景一起滚出，无需 opacity 映射 */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-stone-500 pointer-events-none select-none dark:text-gray-500"
          aria-hidden
        >
          <span className="hero-scroll-label text-[10px] font-medium opacity-60">向下滚动</span>
          <motion.span
            className="hero-scroll-arrow"
            animate={reduced ? { opacity: 0.5 } : { y: [-4, 6, -4], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown size={16} />
          </motion.span>
        </div>
      </motion.section>
    </>
  );
}
