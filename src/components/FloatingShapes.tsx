'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface FloatingShapesProps {
  /** Number of shapes (default: 6) */
  count?: number;
  className?: string;
  /** Seed for reproducible positions */
  seed?: number;
}

type ShapeKind = 'circle' | 'square' | 'triangle' | 'ring' | 'cross';

/**
 * Floating geometric shapes — subtle ambient decoration.
 *
 * Performance:
 *   - Framer Motion animates only `transform` (GPU-composited).
 *   - `pointer-events: none` + low opacity keeps them unobtrusive.
 *   - Deterministic mulberry32 PRNG so SSR === client.
 *
 * Inspired by: Arfazrll/PersonalBlog floating geometry + Kashan-2912
 * blueprint grid aesthetic.
 */
export default function FloatingShapes({
  count = 6,
  className = '',
  seed = 13,
}: FloatingShapesProps) {
  const shapes = useMemo(() => {
    const makeRng = (s: number) => {
      let a = s >>> 0;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const rng = makeRng(seed + 1);
    const kinds: ShapeKind[] = ['circle', 'square', 'triangle', 'ring', 'cross'];

    return Array.from({ length: count }, (_, i) => {
      const kind = kinds[Math.floor(rng() * kinds.length)]!;
      return {
        id: i,
        kind,
        left: `${5 + rng() * 85}%`,
        top: `${5 + rng() * 85}%`,
        size: 24 + rng() * 48,
        duration: 14 + rng() * 12,
        delay: rng() * 4,
        rotate: rng() * 360,
        // Warm palette: pink / violet / amber
        color: ['#f472b6', '#c084fc', '#fbbf24', '#f87171'][Math.floor(rng() * 4)]!,
        opacity: 0.12 + rng() * 0.1,
      };
    });
  }, [count, seed]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
          initial={{ y: 0, rotate: s.rotate }}
          animate={{
            y: [0, -24, 12, -18, 0],
            x: [0, 12, -8, 16, 0],
            rotate: [s.rotate, s.rotate + 90, s.rotate + 180, s.rotate + 270, s.rotate + 360],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Shape kind={s.kind} size={s.size} color={s.color} />
        </motion.div>
      ))}
    </div>
  );
}

function Shape({
  kind,
  size,
  color,
}: {
  kind: ShapeKind;
  size: number;
  color: string;
}) {
  const stroke = 1.5;
  switch (kind) {
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="48" stroke={color} strokeWidth={stroke} />
        </svg>
      );
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <rect x="4" y="4" width="92" height="92" stroke={color} strokeWidth={stroke} />
        </svg>
      );
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M50 6 L94 90 L6 90 Z" stroke={color} strokeWidth={stroke} />
        </svg>
      );
    case 'ring':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="30" stroke={color} strokeWidth={stroke} />
          <circle cx="50" cy="50" r="44" stroke={color} strokeWidth={stroke} opacity={0.5} />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <line x1="50" y1="6" x2="50" y2="94" stroke={color} strokeWidth={stroke} />
          <line x1="6" y1="50" x2="94" y2="50" stroke={color} strokeWidth={stroke} />
        </svg>
      );
  }
}
