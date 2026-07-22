'use client';

import { useMemo } from 'react';

interface StarFieldProps {
  count?: number;
  className?: string;
  seed?: number;
}

export default function StarField({ count = 100, className = '', seed = 7 }: StarFieldProps) {
  const stars = useMemo(() => {
    const rng = (s: number) => { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    const r = rng(seed + 1);
    return Array.from({ length: count }, (_, i) => ({
      id: i, left: `${r() * 100}%`, top: `${r() * 100}%`,
      size: 0.5 + r() * 2, delay: r() * 6, duration: 2 + r() * 5,
      type: r() < 0.25 ? 'warm' : r() < 0.5 ? 'cool' : 'neutral',
      bright: 0.5 + r() * 0.5,
    }));
  }, [count, seed]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {stars.map((s) => {
        const hue = s.type === 'warm' ? 45 : s.type === 'cool' ? 210 : 0;
        const sat = s.type === 'neutral' ? '0%' : '80%';
        const col = s.type === 'neutral' ? '#fafaf9' : `hsl(${hue}, ${sat}, 75%)`;
        return (
          <div key={s.id} className="absolute" style={{ left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px` }}>
            <div className="absolute rounded-full inset-0" style={{ background: col, boxShadow: `0 0 ${s.size * 3}px ${col}${Math.round(s.bright * 60)}`, animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite` }} />
            {s.size > 1.2 && <div className="absolute rounded-full" style={{ inset: `-${s.size * 2}px`, background: `radial-gradient(circle, ${col}44, transparent 70%)`, animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`, opacity: 0.3 }} />}
          </div>
        );
      })}
      <style>{`@keyframes twinkle { 0%,100% { opacity: 0.1; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.3); } }`}</style>
    </div>
  );
}
