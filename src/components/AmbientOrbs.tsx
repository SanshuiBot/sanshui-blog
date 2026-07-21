'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface AmbientOrbsProps {
  className?: string;
  /** Seed for reproducible positions */
  seed?: number;
}

/**
 * Ambient glowing orbs — large soft lights that drift slowly.
 *
 * Pure CSS gradients + Framer Motion `transform` (GPU-composited).
 * `pointer-events: none` + `position: fixed`.
 *
 * Inspired by: lapeyrade/nextjs-portfolio-blog-template ambient lighting
 * and Neo-Blog glassmorphism backdrops.
 */
export default function AmbientOrbs({
  className = '',
  seed = 31,
}: AmbientOrbsProps) {
  const orbs = useMemo(() => {
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

    // 3 orbs: warm, cool, accent — each drifting on its own path
    const configs = [
      { color: 'rgba(220, 38, 38, 0.18)', size: 480, x: '8%', y: '12%' },
      { color: 'rgba(251, 191, 36, 0.14)', size: 380, x: '78%', y: '18%' },
      { color: 'rgba(244, 114, 182, 0.12)', size: 520, x: '55%', y: '72%' },
    ];

    return configs.map((c, i) => ({
      id: i,
      ...c,
      duration: 18 + rng() * 10,
      delay: rng() * 3,
    }));
  }, [seed]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {orbs.map((o) => (
        <motion.div
          key={o.id}
          className="absolute rounded-full"
          style={{
            left: o.x,
            top: o.y,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -30, 25, -15, 0],
            scale: [1, 1.15, 0.92, 1.08, 1],
          }}
          transition={{
            duration: o.duration,
            delay: o.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
