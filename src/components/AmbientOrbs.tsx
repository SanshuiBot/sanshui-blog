'use client';

import { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface AmbientOrbsProps {
  className?: string;
  seed?: number;
}

/**
 * Enhanced ambient orbs — large soft gradient blobs with scroll parallax.
 * Pure CSS + Framer Motion transform — GPU composited.
 */
export default function AmbientOrbs({ className = '', seed = 31 }: AmbientOrbsProps) {
  const { scrollY } = useScroll();

  const orbs = useMemo(() => {
    const makeRng = (s: number) => {
      let a = s >>> 0; return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const rng = makeRng(seed + 1);

    const configs = [
      { color: 'rgba(220, 38, 38, 0.18)', size: 520, x: '8%', y: '12%', parallaxFactor: 0.08 },
      { color: 'rgba(251, 191, 36, 0.14)', size: 400, x: '78%', y: '18%', parallaxFactor: 0.05 },
      { color: 'rgba(244, 114, 182, 0.12)', size: 560, x: '55%', y: '72%', parallaxFactor: 0.12 },
      { color: 'rgba(96, 165, 250, 0.1)', size: 380, x: '20%', y: '80%', parallaxFactor: 0.06 },
    ];

    return configs.map((c, i) => ({
      id: i, ...c,
      duration: 18 + rng() * 12,
      delay: rng() * 4,
      floatX: [0, (rng() - 0.5) * 60, 0],
      floatY: [0, (rng() - 0.5) * 50, 0],
    }));
  }, [seed]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className} dark:opacity-80`} aria-hidden="true">
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
            willChange: 'transform',
            y: useTransform(scrollY, [0, 1500], [0, -(o.parallaxFactor * 1500)]),
          }}
          animate={{
            x: o.floatX,
            y: o.floatY,
            scale: [1, 1.12, 0.9, 1.08, 1],
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
