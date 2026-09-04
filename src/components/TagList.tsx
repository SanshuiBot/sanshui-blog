'use client';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type Variants,
} from 'framer-motion';
import { Hash } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

function TagItem({ name, count, color }: { name: string; count: number; color: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  // 每次进入都 +1，作为涟漪 key：快速重新进入时旧涟漪作废、新涟漪重新播放
  const [rippleRun, setRippleRun] = useState(0);

  // Mouse-following spotlight
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const spotlight = useTransform(
    [sx, sy],
    ([x, y]) =>
      `radial-gradient(280px circle at ${x}% ${y}%, color-mix(in srgb, ${color} 45%, transparent) 0%, color-mix(in srgb, ${color} 20%, transparent) 40%, transparent 72%)`,
  );

  // 3D tilt
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 100, damping: 14 });
  const sry = useSpring(ry, { stiffness: 100, damping: 14 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 100);
    my.set(py * 100);
    ry.set((px - 0.5) * 6);
    rx.set(-(py - 0.5) * 6);
  };

  const onHoverStart = () => {
    setIsHovered(true);
    setRippleRun((r) => r + 1);
  };
  const onLeave = () => {
    setIsHovered(false);
    mx.set(50);
    my.set(50);
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -8 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14, mass: 0.7 }}
      onHoverStart={onHoverStart}
      onHoverEnd={onLeave}
    >
      <div style={{ perspective: '600px' }}>
        <Link
          ref={ref}
          href={`/tags/${encodeURIComponent(name)}/`}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass glass-flat border border-black/[0.06] overflow-hidden dark:border-white/10"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Spotlight */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: spotlight }}
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0.5 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />

          {/* 3D tilt layer */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
          />

          {/* Ripple ring on hover start（不用 AnimatePresence：key 变化即重建，避免退出动画的 onAnimationComplete 提前清掉新涟漪） */}
          {rippleRun > 0 && (
            <motion.span
              key={rippleRun}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 2.8, opacity: 0 }}
              onAnimationComplete={() => setRippleRun((r) => (r === rippleRun ? 0 : r))}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `3px solid color-mix(in srgb, ${color} 95%, transparent)`,
                boxShadow: `0 0 28px color-mix(in srgb, ${color} 85%, transparent), inset 0 0 16px color-mix(in srgb, ${color} 40%, transparent)`,
              }}
            />
          )}

          {/* Hash icon with colored glow */}
          <motion.span
            className="relative flex items-center justify-center"
            animate={{
              rotate: isHovered ? 360 : 0,
              filter: isHovered
                ? `drop-shadow(0 0 8px color-mix(in srgb, ${color} 70%, transparent))`
                : `drop-shadow(0 0 2px color-mix(in srgb, ${color} 25%, transparent))`,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 12 }}
          >
            <Hash size={12} style={{ color }} />
          </motion.span>

          {/* Text labels */}
          <span className="relative text-sm font-medium text-stone-700 dark:text-fg group-hover:text-stone-900 dark:group-hover:text-white transition-colors duration-300">
            {name}
          </span>
          <span className="relative text-xs text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-gray-300 transition-colors duration-300">
            ({count})
          </span>

          {/* Shimmer sweep on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.span
                key="shimmer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
              >
                <motion.span
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${color} 7%, transparent) 45%, color-mix(in srgb, ${color} 9%, transparent) 50%, color-mix(in srgb, ${color} 7%, transparent) 55%, transparent 100%)`,
                  }}
                  initial={{ x: '-100%' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{
                    duration: 1.8,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatDelay: 1.5,
                  }}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.div>
  );
}

// ── 入场变体：标签云交错浮现（与项目/友链卡片同款节奏） ──
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function TagList({
  tags,
  colors,
}: {
  tags: { name: string; count: number }[];
  colors: string[];
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-wrap gap-6 justify-center"
    >
      {tags.map((t, i) => (
        <motion.div key={t.name} variants={item}>
          <TagItem name={t.name} count={t.count} color={colors[i % colors.length]!} />
        </motion.div>
      ))}
    </motion.div>
  );
}
