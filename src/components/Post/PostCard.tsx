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
 *
 *  6. Spotlight + 3D tilt 由 CardSpotlight 子组件懒初始化：
 *     skeleton=true 时不挂载 → 不创建 MotionValue/Spring 实例，
 *     节省同屏多张骨架卡的内存和 rAF 开销。
 */
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';
import { formatDate } from '@/lib/formatDate';
import { postUrl, type PostIndexEntry } from '@/lib/post-index';
import CardSpotlight from './CardSpotlight';
import type { SpotlightRefs } from './CardSpotlight';

const tagGradients = [
  'from-accent-pink/20 to-accent-rose/20',
  'from-accent-violet/20 to-accent-pink/20',
  'from-accent-blue/20 to-accent-teal/20',
  'from-accent-teal/20 to-accent-blue/20',
  'from-accent-gold/20 to-accent-rose/20',
] as const;

/**
 * 标签渐变循环语义：共 5 条，第 6 个标签复用第 0 条（index % 5）。
 * 视觉上 pink→violet→blue→teal→gold 五色循环，rose 作为终点色与起点粉色呼应。
 */

/**
 * 骨架层——与卡片同尺寸、同圆角，absolute 铺满容器。
 * 结构与真实卡片镜像（顶部渐变条 / 标签行 / 标题 / 摘要 / 底部 footer 分隔线），
 * 并随断点响应：手机窄卡 2 标签 + 无摘要、≥sm 3 标签 + 两行摘要，与卡片渲染一致，
 * 避免骨架形态与最终卡片错位。animate-pulse 给「正在加载」信号；外层通过 opacity
 * 渐隐它（不是卸载），这样骨架消失与卡片显现是同一帧的叠加，没有空白间隙。
 */
function SkeletonLayer() {
  return (
    <div
      className="absolute inset-0 rounded-2xl bg-black/[0.06] animate-pulse overflow-hidden dark:bg-white/10"
      aria-hidden="true"
    >
      <div className="h-[2px] bg-black/[0.06] w-full dark:bg-white/10" />
      <div className="flex h-full flex-col p-4 sm:p-6">
        {/* 标签行：手机 2 个 / ≥sm 3 个（与卡片 slice 策略一致） */}
        <div className="mb-3 flex min-h-[1.375rem] gap-1 sm:gap-1.5">
          <div className="h-4 w-10 rounded-full bg-black/[0.06] dark:bg-white/10" />
          <div className="h-4 w-8 rounded-full bg-black/[0.06] dark:bg-white/10" />
          <div className="hidden h-4 w-9 rounded-full bg-black/[0.06] sm:block dark:bg-white/10" />
        </div>
        {/* 标题两行（与卡片 line-clamp-2 高度同量级） */}
        <div className="mb-2 space-y-2">
          <div className="h-5 w-full rounded bg-black/[0.06] dark:bg-white/10" />
          <div className="h-5 w-3/4 rounded bg-black/[0.06] dark:bg-white/10" />
        </div>
        {/* 摘要：手机卡片无摘要（line-clamp-1 也被 flex 挤压），≥sm 显示两行 */}
        <div className="mt-2 hidden space-y-2 sm:block">
          <div className="h-3.5 w-full rounded bg-black/[0.06] dark:bg-white/10" />
          <div className="h-3.5 w-2/3 rounded bg-black/[0.06] dark:bg-white/10" />
        </div>
        {/* footer 分隔线沉底（与卡片 mt-auto footer 对齐） */}
        <div className="mt-auto pt-4">
          <div className="h-px w-full bg-black/[0.06] dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function PostCard({
  post,
  skeleton = false,
  skeletonDelayMs = 0,
}: {
  post: PostIndexEntry;
  /**
   * 骨架模式：true 时骨架层可见、卡片层 opacity:0。
   * 切到 false 时，两层 opacity 同步反向过渡，骨架直接被卡片覆盖，零空白帧。
   */
  skeleton?: boolean;
  /**
   * 骨架首次挂载的入场延迟（ms）。PostGrid 按槽位错峰传入（i * step），
   * 实现「骨架一格一格快速铺满」的加载节奏；数据到达后的卡片填充不受影响。
   */
  skeletonDelayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { startNavigation } = useNavigationLoading();
  const router = useRouter();
  // 不用 withBase()：next/link 的 <Link> 和 router.prefetch 都会自动注入 basePath
  const postHref = postUrl(post.slug);
  const prefetchedRef = useRef(false);
  // 标签真实总数：+N 余量胶囊的基数必须与此一致，避免「显示数 + N ≠ 实际标签数」
  const tags = post.tags ?? [];

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

  // 骨架模式不挂载 spotlight 子组件，节省 MotionValue/Spring 实例。
  // 用 state 存储 refs（而非 ref.current）：CardSpotlight effect 调用 onRefs 后触发重渲染，
  // 保证渲染期能安全访问 spotlight 值。
  const [spotlight, setSpotlight] = useState<SpotlightRefs | null>(null);

  // 骨架→卡片切换的过渡：
  //  - 骨架入场：快速淡入（duration 0.15s）+ 按槽位 delay 错峰（skeletonDelayMs），
  //    形成「一格一格快速铺满」的加载节奏。
  //  - 骨架离场 / 卡片入场：同一帧反向开始（同 duration 同步），零空白帧；
  //    卡片用 scale+opacity（0.96→1）柔和浮现。
  // 不用 y 位移：位移会让卡片在途中「露半张」，配合骨架已消失时观感是空白（红线 #15）。
  const skeletonEnter = {
    duration: 0.15,
    ease: 'easeOut' as const,
    delay: skeletonDelayMs / 1000,
  };
  const cardReveal = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="relative h-56 sm:h-60">
      {/* 骨架层：absolute 铺底，skeleton=true 时可见，切到卡片时 opacity 渐隐。
          AnimatePresence 让骨架在 skeleton 切到 false 时淡出，而非瞬间消失。 */}
      <AnimatePresence>
        {skeleton && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: skeletonEnter }}
            exit={{ opacity: 0, transition: cardReveal }}
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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: cardReveal }}
            style={{ pointerEvents: 'auto' }}
          >
            <div
              ref={ref}
              onMouseMove={(e) => spotlight?.onMove(e)}
              onMouseLeave={() => spotlight?.onLeave()}
              className="group relative h-full"
              style={{ perspective: '800px' }}
            >
              {/* Spotlight — 仅在非骨架模式下挂载，节省 MotionValue 实例 */}
              {!skeleton && <CardSpotlight ref={ref} onRefs={setSpotlight} />}

              {/* Spotlight glow layer */}
              <motion.div
                aria-hidden
                className="absolute -inset-px rounded-2xl pointer-events-none"
                style={{
                  background: spotlight?.spotlight ?? '',
                  opacity: 0,
                }}
                animate={{ opacity: spotlight ? 1 : 0 }}
                initial={{ opacity: 0 }}
              />

              {/* Card wrapper with spring hover */}
              <motion.div
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, mass: 0.8 }}
                style={{
                  rotateX: spotlight?.rotateX,
                  rotateY: spotlight?.rotateY,
                  transformStyle: 'preserve-3d',
                }}
                className="p-[1px] rounded-2xl bg-black/[0.03] h-full post-card-shell shadow-neon-hover dark:bg-white/10"
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
                  className="relative flex flex-col h-full bg-white rounded-2xl overflow-hidden dark:bg-surface"
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

                  <div className="flex-1 p-4 sm:p-6 flex flex-col">
                    {/* Tags — standalone links */}
                    <motion.div
                      className="flex flex-wrap gap-1.5 mb-3 min-h-[1.375rem] max-sm:flex-nowrap max-sm:gap-1"
                      whileHover="hovered"
                      initial="idle"
                    >
                      {tags.slice(0, 3).map((t: string, i: number) => (
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
                          className={i >= 2 ? 'max-sm:hidden' : 'max-sm:min-w-0'}
                        >
                          <Link
                            href={`/tags/${encodeURIComponent(t)}/`}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap min-w-0 max-w-full overflow-hidden bg-gradient-to-r ${tagGradients[i % tagGradients.length]} text-stone-600 hover:text-stone-900 transition-colors dark:text-gray-400 dark:hover:text-fg`}
                          >
                            <Tag size={9} className="shrink-0" />
                            {/* 手机窄卡空间不足时标签文字省略（+N 胶囊仍在，不会误导标签总数）。
                                min-w-0 + truncate：span 是锚点 flex 容器的子项，须 min-w-0 才能收缩出省略号；
                                锚点须为块级 flex（非 inline-flex）才会随父 wrapper 收缩。 */}
                            <span className="min-w-0 truncate">{t}</span>
                          </Link>
                        </motion.div>
                      ))}
                      {/* 余量胶囊：已显示标签数 + N = 真实标签总数，两端自洽。
                          手机端（<640px）两列窄卡放 2 个 → +{len-2}；桌面端放 3 个 → 若还有更多显示 +{len-3}，
                          避免用户误以为「只有显示出来的这几个」。 */}
                      {tags.length > 2 && (
                        <span
                          aria-hidden
                          className="sm:hidden shrink-0 whitespace-nowrap inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] text-stone-500 dark:bg-white/10 dark:text-gray-400"
                        >
                          +{tags.length - 2}
                        </span>
                      )}
                      {tags.length > 3 && (
                        <span
                          aria-hidden
                          className="hidden sm:inline-flex shrink-0 whitespace-nowrap items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] text-stone-500 dark:bg-white/10 dark:text-gray-400"
                        >
                          +{tags.length - 3}
                        </span>
                      )}
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
                        className="post-card-title text-base sm:text-lg font-bold mb-2 line-clamp-2 overflow-hidden h-[2.75rem] sm:h-[3.094rem] tracking-tight leading-snug shrink-0"
                        whileHover={{ x: 5 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
                      >
                        {post.title}
                      </motion.h2>

                      {/* Excerpt */}
                      <p className="text-stone-500 text-sm leading-relaxed mb-5 line-clamp-1 sm:line-clamp-2 flex-1 min-h-0 dark:text-gray-500">
                        {post.excerpt}
                      </p>

                      {/* Footer with "阅读" as part of the link */}
                      <motion.div
                        className="mt-auto flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/10"
                        whileHover="hovered"
                        initial="idle"
                      >
                        <span className="flex items-center gap-1.5 text-xs text-stone-400 whitespace-nowrap dark:text-gray-600">
                          <Clock size={11} />
                          {formatDate(post.date)}
                        </span>
                        <motion.span
                          className="post-card-readmore inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap transition-colors"
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
