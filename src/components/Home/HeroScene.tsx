'use client';
import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Mail, ArrowDown } from 'lucide-react';
import Github from '@/components/UI/GithubIcon';
import { siteConfig } from '@/lib/site';
import { useState } from 'react';

const social = [
  { icon: Github, href: siteConfig.github, label: 'GitHub' },
  { icon: Mail, href: siteConfig.emailHref, label: 'Email' },
];

interface HeroStats {
  /** 文章总数 */
  posts: number;
  /** 标签总数 */
  tags: number;
  /** 最近一次更新日期（YYYY-MM-DD） */
  lastUpdated: string;
}

export default function HeroScene({ stats }: { stats?: HeroStats }) {
  const statItems = stats
    ? [
        { label: '文章', value: stats.posts },
        { label: '标签', value: stats.tags },
        { label: '最近更新', value: stats.lastUpdated },
      ]
    : [];
  // Hero 改为 fixed 铺满视口后，淡出区间用一屏视口高度（vh 像素）驱动，
  // 保证任意屏幕尺寸下「滚一屏 Hero 完全淡出」，与下方 PostsList 的 pt-[100dvh] 对齐。
  const [vh, setVh] = useState(800);
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, vh * 0.8], [1, 0]);
  const y = useTransform(scrollY, [0, vh * 0.8], [0, vh * 0.12]);
  const [ctaDir, setCtaDir] = useState<'left' | 'right' | 'center'>('center');
  const btnRef = useRef<HTMLAnchorElement>(null);
  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);
  const sBtnX = useSpring(btnX, { stiffness: 200, damping: 18 });
  const sBtnY = useSpring(btnY, { stiffness: 200, damping: 18 });

  const onBtnMove = (e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    btnX.set(dx * 10);
    btnY.set(dy * 10);
    setCtaDir(dx < -0.3 ? 'left' : dx > 0.3 ? 'right' : 'center');
  };
  const onBtnLeave = () => {
    btnX.set(0);
    btnY.set(0);
    setCtaDir('center');
  };

  return (
    <motion.section
      style={{ opacity, y }}
      className="fixed inset-0 flex items-center justify-center overflow-hidden z-0"
    >
      {/* Aurora blobs */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full bg-accent-violet/5 blur-[150px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-accent-pink/4 blur-[130px] animate-float-delayed pointer-events-none" />
      <div
        className="absolute top-1/2 right-1/3 w-[25rem] h-[25rem] rounded-full bg-accent-blue/4 blur-[100px] animate-float pointer-events-none"
        style={{ animationDelay: '3s' }}
      />

      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="block text-white">你好，我是</span>
            <span className="block mt-3 text-aurora">{siteConfig.name}</span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            用文字沉淀知识，用代码改变世界。
          </motion.p>

          {/* Stats — 玻璃胶囊行，与 PostCard 标签渐变呼应 */}
          {statItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.56 }}
              className="flex flex-wrap items-center justify-center gap-2 mb-10"
            >
              {statItems.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass border border-white/10 text-gray-300"
                >
                  <span className="text-gray-500">{s.label}</span>
                  <span className="text-white tabular-nums">{s.value}</span>
                </span>
              ))}
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
              onMouseLeave={onBtnLeave}
              style={{ x: sBtnX, y: sBtnY }}
              className="group relative inline-flex items-center gap-3 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm"
            >
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    ctaDir === 'left'
                      ? 'linear-gradient(135deg,rgb(var(--accent-violet-rgb) / 0.15),transparent 60%)'
                      : ctaDir === 'right'
                        ? 'linear-gradient(225deg,rgb(var(--accent-pink-rgb) / 0.15),transparent 60%)'
                        : 'linear-gradient(180deg,rgb(var(--accent-violet-rgb) / 0.1),transparent 60%)',
                }}
              />
              <span className="relative z-10">浏览文章</span>
            </motion.a>
            <div className="flex items-center gap-1">
              {social.map(({ icon: Icon, href, label }) => (
                <motion.div
                  key={label}
                  className="relative"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                  whileHover={{ y: -2 }}
                >
                  <motion.a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    aria-label={label}
                    className="relative block p-3 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                  >
                    <Icon size={18} />
                  </motion.a>
                  {/* Tooltip label */}
                  <motion.span
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500 whitespace-nowrap pointer-events-none"
                    initial={{ opacity: 0, y: 2 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {label}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll down indicator — bottom-center, 箭头 bounce 动画 */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-500 pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="text-[10px] font-medium tracking-widest opacity-60">向下滚动</span>
        <motion.span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-white/15"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={12} />
        </motion.span>
      </div>
    </motion.section>
  );
}
