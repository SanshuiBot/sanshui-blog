'use client';

import { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface AmbientOrbsProps { className?: string; seed?: number; }

export default function AmbientOrbs({ className = '', seed = 31 }: AmbientOrbsProps) {
  const { scrollY } = useScroll();
  const orbs = useMemo(() => {
    const rng = (s: number) => { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    const r = rng(seed + 1);
    return [
      { color: 'rgba(220, 38, 38, 0.18)', size: 520, x: '8%', y: '12%', pf: 0.08 },
      { color: 'rgba(251, 191, 36, 0.14)', size: 400, x: '78%', y: '18%', pf: 0.05 },
      { color: 'rgba(244, 114, 182, 0.12)', size: 560, x: '55%', y: '72%', pf: 0.12 },
      { color: 'rgba(96, 165, 250, 0.1)', size: 380, x: '20%', y: '80%', pf: 0.06 },
    ].map((c, i) => ({ ...c, id: i, duration: 18 + r() * 12, delay: r() * 4, fx: [0, (r() - 0.5) * 60, 0], fy: [0, (r() - 0.5) * 50, 0] }));
  }, [seed]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className} dark:opacity-80`} aria-hidden="true">
      {orbs.map((o) => (
        <motion.div key={o.id} className="absolute rounded-full" style={{
          left: o.x, top: o.y, width: o.size, height: o.size,
          background: `radial-gradient(circle, ${o.color}, transparent 70%)`, filter: 'blur(80px)', willChange: 'transform',
          y: useTransform(scrollY, [0, 1500], [0, -(o.pf * 1500)]),
        }} animate={{ x: o.fx, y: o.fy, scale: [1, 1.12, 0.9, 1.08, 1] }} transition={{ duration: o.duration, delay: o.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}
