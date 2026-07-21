'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

interface ScrollParallaxProps {
  children: ReactNode;
  className?: string;
  /** Vertical parallax range in px (moves from -offset to +offset) */
  offset?: number;
  /** Horizontal parallax range in px */
  offsetX?: number;
  /** Rotation range in degrees */
  rotate?: number;
  /** Scale range (e.g. 0.1 → scales from 0.9 to 1.1) */
  scale?: number;
  /** Scroll start offset as viewport fraction (0=top, 1=bottom) */
  start?: string;
  /** Scroll end offset */
  end?: string;
}

/**
 * Scroll-driven parallax wrapper.
 *
 * Performance:
 *   - `useScroll` + `useTransform` → GPU-composited `transform` only.
 *   - No scroll event listeners (Framer Motion uses IntersectionObserver internally).
 *   - `will-change: transform` applied only while animating.
 *
 * Inspired by: Abdssamie/nextjs-portfolio-blog scroll-driven animations
 * and Kashan-2912/modern-portfolio parallax layers.
 */
export default function ScrollParallax({
  children,
  className = '',
  offset = 60,
  offsetX = 0,
  rotate = 0,
  scale = 0,
  start = 'start end',
  end = 'end start',
}: ScrollParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [start, end] as never,
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  const x = useTransform(scrollYProgress, [0, 1], [-offsetX, offsetX]);
  const r = useTransform(scrollYProgress, [0, 1], [-rotate, rotate]);
  const s = useTransform(scrollYProgress, [0, 0.5, 1], [1 - scale, 1, 1 + scale]) as MotionValue<number>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y, x, rotate: r, scale: s }}
    >
      {children}
    </motion.div>
  );
}
