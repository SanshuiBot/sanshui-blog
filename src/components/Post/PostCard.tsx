'use client';
/**
 * PostCard — 文章卡片
 * -----------------------------
 * 设计要点（与 PostGrid 配合，实现「跟手」流式渲染）：
 *
 *  1. 骨架层与卡片层**同时挂载于同一容器**，absolute 叠放，只通过 opacity 切换显隐。
 *     骨架在下、卡片在上；骨架渐隐与卡片渐显是**同一 DOM 帧的叠加**，零空白帧。
 *     这是「跟手」的关键——不是先卸载骨架再挂载卡片，而是骨架直接被卡片覆盖。
 *
 *  2. 入场动画从 `whileInView` 改为挂载即播放（animate）——列表场景的卡片总是从下方
 *     进入视野，等 IntersectionObserver 反而不跟手；挂载即播放配合 PostGrid 的逐张填充，
 *     用户看到的是「一张张卡片冒出来」。
 *
 *  3. 骨架模式下卡片内容层 opacity:0（仍挂载但不可见，省去切换时重挂的开销）；
 *     切到非骨架模式时，骨架层 opacity:1→0 渐隐、卡片层 opacity:0→1 渐显，同步过渡。
 *
 *  4. hover 变色仍走纯 CSS（`.post-card-title` / `.post-card-readmore`），
 *     位移动画走 Framer Motion（AGENTS.md #24）。
 *
 *  5. 容器用固定 h-60（240px）——所有卡片（含骨架）共享同一高度，
 *     不因标题/摘要行数不同而参差不齐，也不会裁切「时间/阅读」行。
 *     骨架层与卡片层均 absolute 铺满固定容器，通过 opacity 交叉淡入淡出。
 *     骨架模式下卡片层不挂载（避免空 post 撑高度）。
 */
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';
import type { Post } from '@/lib/types';

const tagGradients = [
  'from-accent-pink/20 to-accent-rose/20',
  'from-accent-violet/20 to-accent-pink/20',
  'from-accent-blue/20 to-accent-teal/20',
  'from-accent-teal/20 to-accent-blue/20',
  'from-accent-gold/20 to-accent-rose/20',
];

/**
 * 骨架层——与卡片同尺寸、同圆角，absolute 铺满容器。
 * animate-pulse 给「正在加载」信号；外层通过 opacity 渐隐它（不是卸载），
 * 这样骨架消失与卡片显现是同一帧的叠加，没有空白间隙。
 */
function SkeletonLayer() {
  return (
    <div
      className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse overflow-hidden"
      aria-hidden="true"
    >
      <div className="h-[2px] bg-white/10 w-full" />
      <div className="px-5 pt-4 flex gap-1.5">
        <div className="h-4 w-10 rounded-full bg-white/10" />
        <div className="h-4 w-8 rounded-full bg-white/10" />
      </div>
      <div className="px-5 pt-3">
        <div className="h-5 w-full rounded bg-white/10 mb-2" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
      </div>
      <div className="px-5 pt-4 mt-auto">
        <div className="h-px w-full bg-white/10" />
      </div>
    </div>
  );
}

export default function PostCard({
  post,
  skeleton = false,
}: {
  post: Post;
  /**
   * 骨架模式：true 时骨架层可见、卡片层 opacity:0。
   * 切到 false 时，两层 opacity 同步反向过渡，骨架直接被卡片覆盖，零空白帧。
   */
  skeleton?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { startNavigation } = useNavigationLoading();
  const router = useRouter();
  // 不用 withBase()：next/link 的 <Link> 和 router.prefetch 都会自动注入 basePath
  const postHref = `/posts/${post.slug}/`;
  const prefetchedRef = useRef(false);

  // PostGrid 用稳定 slot key 复用 PostCard 实例，
  // post.slug 变化时重置 prefetchedRef，避免新文章 hover 时跳过 prefetch。
  useEffect(() => {
    prefetchedRef.current = false;
  }, [post.slug]);

  const onCardMouseEnter = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    router.prefetch(postHref);
  };

  // Mouse-following spotlight
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 100, damping: 20 });
  const sy = useSpring(my, { stiffness: 100, damping: 20 });
  const spotlight = useTransform(
    [sx, sy],
    ([x, y]) =>
      `radial-gradient(280px circle at ${x}% ${y}%, rgb(var(--accent-violet-rgb) / 0.22), rgb(var(--accent-pink-rgb) / 0.12) 30%, transparent 60%)`,
  );

  // 3D tilt values
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 15 });
  const sry = useSpring(ry, { stiffness: 120, damping: 15 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 100);
    my.set(py * 100);
    ry.set((px - 0.5) * 5);
    rx.set(-(py - 0.5) * 5);
  };
  const onLeave = () => {
    mx.set(50);
    my.set(50);
    rx.set(0);
    ry.set(0);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // 骨架→卡片切换的统一过渡：两层用完全相同的 transition，同步渐隐/渐显，零空白帧。
  // duration 短到 0.25s：骨架快速被卡片覆盖，视觉上是「直接变卡片」而非「缓慢淡入」。
  // 不用 y 位移：位移会让卡片在途中「露半张」，配合骨架已消失时观感是空白。
  const reveal = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="relative h-60">
      {/* 骨架层：absolute 铺底，skeleton=true 时可见，切到卡片时 opacity 渐隐。
          AnimatePresence 让骨架在 skeleton 切到 false 时淡出，而非瞬间消失。 */}
      <AnimatePresence>
        {skeleton && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reveal}
            style={{ pointerEvents: 'auto' }}
          >
            <SkeletonLayer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 卡片层：absolute 铺底撑满固定容器，skeleton=false 时可见。
          外层 h-60 固定高度 → 所有卡片高度一致，不再因标题/摘要行数不同而参差不齐。
          骨架模式不挂载（避免空 post 撑高度），切到非骨架时挂载并淡入。 */}
      <AnimatePresence>
        {!skeleton && (
          <motion.div
            className="absolute inset-0 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reveal}
            style={{ pointerEvents: 'auto' }}
          >
            <div
              ref={ref}
              onMouseMove={onMove}
              onMouseLeave={onLeave}
              className="group relative h-full"
              style={{ perspective: '800px' }}
            >
              {/* Spotlight */}
              <motion.div
                aria-hidden
                className="absolute -inset-px rounded-2xl pointer-events-none"
                style={{ background: spotlight, opacity: 0 }}
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
              />

              {/* Card wrapper with spring hover */}
              <motion.div
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, mass: 0.8 }}
                style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
                className="p-[1px] rounded-2xl bg-white/5 h-full shadow-neon-hover"
              >
                {/* Border glow */}
                <motion.div
                  aria-hidden
                  className="absolute -inset-[1px] rounded-2xl pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgb(var(--accent-pink-rgb) / 0.4), rgb(var(--accent-violet-rgb) / 0.3), rgb(var(--accent-blue-rgb) / 0.2))',
                    opacity: 0,
                  }}
                  whileHover={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                />

                <article
                  className="relative flex flex-col h-full bg-surface rounded-2xl overflow-hidden"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Animated top accent line */}
                  <motion.div
                    className="h-[2px] bg-gradient-to-r from-accent-pink via-accent-violet to-accent-blue"
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileHover={{ scaleX: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                    style={{ transformOrigin: 'left' }}
                  />

                  <div className="flex-1 p-5 sm:p-6 flex flex-col">
                    {/* Tags — standalone links */}
                    <motion.div
                      className="flex flex-wrap gap-1.5 mb-3 min-h-[1.375rem]"
                      whileHover="hovered"
                      initial="idle"
                    >
                      {(post.tags ?? []).slice(0, 3).map((t: string, i: number) => (
                        <motion.div
                          key={t}
                          variants={{
                            idle: { y: 0, opacity: 1 },
                            hovered: { y: -2, opacity: 1 },
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                            delay: i * 0.03,
                          }}
                        >
                          <Link
                            href={`/tags/${encodeURIComponent(t)}/`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${tagGradients[i % tagGradients.length]} text-gray-400 hover:text-white transition-colors`}
                          >
                            <Tag size={9} />
                            {t}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Everything below is ONE link to the post — no ambiguity */}
                    <Link
                      href={postHref}
                      prefetch={false}
                      onClick={startNavigation}
                      onMouseEnter={onCardMouseEnter}
                      className="post-card-link flex-1 flex flex-col"
                    >
                      {/* Title — 位移走 Framer whileHover（JS 驱动，绕开 CSS transition 被 reduced-motion 压制，任何环境都有动画）；
                          变色仍走纯 CSS（.post-card-title），避免 inline style 固化颜色导致主题切换失响应 */}
                      <motion.h2
                        className="post-card-title text-lg font-bold mb-2 line-clamp-2 overflow-hidden h-[3.094rem] tracking-tight leading-snug shrink-0"
                        whileHover={{ x: 5 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
                      >
                        {post.title}
                      </motion.h2>

                      {/* Excerpt */}
                      <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2 flex-1 min-h-0">
                        {post.excerpt}
                      </p>

                      {/* Footer with "阅读" as part of the link */}
                      <motion.div
                        className="flex items-center justify-between pt-3 border-t border-white/5"
                        whileHover="hovered"
                        initial="idle"
                      >
                        <span className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock size={11} />
                          {fmt(post.date)}
                        </span>
                        <motion.span
                          className="post-card-readmore inline-flex items-center gap-1 text-sm font-medium transition-colors"
                          variants={{
                            idle: { x: 0 },
                            hovered: { x: 3 },
                          }}
                          transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                        >
                          阅读
                          <motion.span
                            variants={{
                              idle: { x: 0, y: 0 },
                              hovered: { x: 2, y: -2 },
                            }}
                            transition={{ type: 'spring', stiffness: 250, damping: 14 }}
                          >
                            <ArrowUpRight size={12} />
                          </motion.span>
                        </motion.span>
                      </motion.div>
                    </Link>
                  </div>
                </article>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
