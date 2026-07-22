'use client';

import { useMemo } from 'react';

interface SparklesProps {
  count?: number; className?: string; seed?: number;
  sizeRange?: [number, number]; hueRange?: [number, number];
  shapes?: ('dot' | 'star' | 'cross')[];
}

export default function Sparkles({ count = 12, className = '', seed = 0, sizeRange = [2, 6], hueRange = [280, 360], shapes = ['dot', 'star'] }: SparklesProps) {
  const sparkles = useMemo(() => {
    const rng = (s: number) => { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    const r = rng(seed + 1);
    return Array.from({ length: count }, (_, i) => ({
      id: i, left: `${5 + r() * 90}%`, top: `${5 + r() * 90}%`,
      size: sizeRange[0] + r() * (sizeRange[1] - sizeRange[0]), delay: r() * 4, duration: 1.5 + r() * 2.5,
      hue: hueRange[0] + r() * (hueRange[1] - hueRange[0]), shape: shapes[Math.floor(r() * shapes.length)],
      sat: 60 + r() * 30, lit: 65 + r() * 20,
    }));
  }, [count, seed, sizeRange, hueRange, shapes]);

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {sparkles.map((s) => (
        <div key={s.id} className="absolute" style={{
          left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px`,
          ...(s.shape === 'star' ? { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' } : { borderRadius: '50%' }),
          background: `hsl(${s.hue}, ${s.sat}%, ${s.lit}%)`,
          boxShadow: `0 0 ${s.size * 3}px hsl(${s.hue}, ${s.sat}%, ${s.lit}%)`,
          animation: `sparkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}
