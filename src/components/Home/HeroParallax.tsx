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
import { siteConfig } from '@/lib/site';
import { withBase } from '@/lib/basePath';
import type { PostIndexEntry } from '@/lib/post-index';

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

export default function HeroParallax({ stats }: { stats?: HeroStats }) {
  const [vh, setVh] = useState(800);
  const [w, setW] = useState(1024);
  useEffect(() => {
    // Hero 区有独立的流光网格（56px），添加 marker 让全局网格（64px）隐藏，避免两层叠加产生摩尔纹
    document.documentElement.classList.add('sanshui-hero-active');
    return () => document.documentElement.classList.remove('sanshui-hero-active');
  }, []);
  useEffect(() => {
    const update = () => {
      setVh(window.innerHeight);
      setW(window.innerWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { scrollY } = useScroll();

  // 最近层（标题/CTA）：随 scrollY 平移 + 淡出
  // opacity / scale 套 useSpring 阻尼——快速滚动时浏览器平滑滚动的惯性会让
  // scrollY 冲过 vh*0.6 后回弹，raw transform 会瞬时跳变「0→正值→0」导致
  // 「你好，我是」闪现；spring 平滑收敛，回弹跳变被吸收为不可见的极小值。
  // 位移 titleY 保留 raw，spring 会让位移有延迟感不跟手。
  const titleOpacity = useSpring(useTransform(scrollY, [0, vh * 0.6], [1, 0]), {
    stiffness: 120,
    damping: 20,
    restDelta: 0.001,
  });
  const titleY = useTransform(scrollY, [0, vh * 0.6], [0, -60]);
  const titleScale = useSpring(useTransform(scrollY, [0, vh * 0.6], [1, 0.92]), {
    stiffness: 120,
    damping: 20,
    restDelta: 0.001,
  });

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
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(withBase('/posts-index.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
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
      <motion.div style={{ y: farY }} className="absolute inset-[-10%] will-change-transform">
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full bg-accent-violet/15 blur-[150px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-accent-pink/12 blur-[130px] animate-float-delayed pointer-events-none" />
        <div aria-hidden className="absolute inset-0 hero-aurora-grid" />
      </motion.div>

      {/* ── 中间层：文章缩略图拼贴墙 ── */}
      <motion.div
        style={{ y: midY, rotate: midRotate }}
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
                <div className="text-[10px] font-mono text-gray-400/40 dark:text-white/20 mb-1">
                  {t.tag}
                </div>
                <div className="text-xs font-semibold text-gray-400/50 dark:text-white/25 leading-snug line-clamp-3">
                  {t.title}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── 最近层：标题 / CTA（中央，视差最快） ── */}
      <motion.div
        style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
        className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center will-change-transform"
      >
        {/* 身份徽章 */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: lineEase }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass hero-badge mb-8"
        >
          <span className="hero-badge-dot" aria-hidden />
          <span className="text-xs font-medium text-gray-300 tracking-wide">
            Creative Developer · 技术博客
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
          <motion.span
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.05, ease: lineEase }}
            className="block text-white"
          >
            你好，我是
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.18, ease: lineEase }}
            className="block mt-3 text-aurora hero-name-shimmer"
          >
            {siteConfig.name}
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          用文字沉淀知识，用代码改变世界。
        </motion.p>

        {/* Stats — 极简 inline 行：数字（单色 accent）· 标签，点分隔 */}
        {statItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
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
                  <span className="hero-stat-inline-num" style={{ color: `rgb(${accent} / 0.95)` }}>
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
          initial={{ opacity: 0, y: 16 }}
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
            style={{ x: sBtnX, y: sBtnY }}
            className="group relative inline-flex items-center gap-3 px-7 py-3 rounded-full hero-cta"
          >
            <span className="hero-cta-glow" />
            <span className="relative z-10 font-semibold text-sm">浏览文章</span>
            <ArrowDown size={15} className="relative z-10 hero-cta-arrow" />
          </motion.a>
          {social.map(({ icon: Icon, href, label }, idx) => (
            <motion.a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              aria-label={label}
              className="block p-3 rounded-full glass hero-social text-gray-400 hover:text-white"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + idx * 0.08, type: 'spring', stiffness: 200 }}
            >
              <Icon size={18} />
            </motion.a>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        style={{ opacity: scrollHintOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-gray-500 pointer-events-none select-none"
        aria-hidden
      >
        <span className="hero-scroll-label text-[10px] font-medium opacity-60">向下滚动</span>
        <motion.span
          aria-hidden
          className="hero-scroll-arrow"
          animate={{ y: [-4, 6, -4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={16} />
        </motion.span>
      </motion.div>
    </motion.section>
  );
}
