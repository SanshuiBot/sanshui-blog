'use client';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Hash } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

function TagItem({
  name,
  count,
  color,
}: {
  name: string;
  count: number;
  color: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  // Mouse-following spotlight
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const spotlight = useTransform(
    [sx, sy],
    ([x, y]) => `radial-gradient(180px circle at ${x}% ${y}%, ${color}28, transparent 70%)`,
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
    setShowRipple(true);
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
          href={`/tags/${encodeURIComponent(name)}`}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass border border-white/5 overflow-hidden"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Spotlight */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: spotlight }}
          />

          {/* 3D tilt layer */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
          />

          {/* Ripple ring on hover start */}
          <AnimatePresence>
            {showRipple && (
              <motion.span
                key="ripple"
                initial={{ scale: 0, opacity: 0.7 }}
                animate={{ scale: 2.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                onAnimationComplete={() => setShowRipple(false)}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: `1.5px solid ${color}80`,
                  boxShadow: `0 0 12px ${color}50`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Hash icon with colored glow */}
          <motion.span
            className="relative flex items-center justify-center"
            animate={{
              rotate: isHovered ? 360 : 0,
              filter: isHovered
                ? `drop-shadow(0 0 6px ${color}90)`
                : `drop-shadow(0 0 2px ${color}40)`,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 12 }}
          >
            <Hash size={12} style={{ color }} />
          </motion.span>

          {/* Text labels */}
          <span className="relative text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white transition-colors duration-300">
            {name}
          </span>
          <span className="relative text-xs text-stone-500 dark:text-stone-500 group-hover:text-stone-700 dark:group-hover:text-gray-400 transition-colors duration-300">
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
                    background: `linear-gradient(90deg, transparent 0%, ${color}12 45%, ${color}18 50%, ${color}12 55%, transparent 100%)`,
                  }}
                  initial={{ x: '-100%' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.5 }}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.div>
  );
}

export default function TagList({
  tags,
  colors,
}: {
  tags: { name: string; count: number }[];
  colors: string[];
}) {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {tags.map((t, i) => (
        <TagItem key={t.name} name={t.name} count={t.count} color={colors[i % colors.length]!} />
      ))}
    </div>
  );
}
