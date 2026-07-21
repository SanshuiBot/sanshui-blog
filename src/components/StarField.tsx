'use client';

import { useMemo } from 'react';

interface StarFieldProps {
  /** Number of stars (default: 80) */
  count?: number;
  className?: string;
  /** Seed for reproducible positions */
  seed?: number;
  /** Star size range in px (default: [0.5, 2]) */
  sizeRange?: [number, number];
  /** Twinkle speed range in seconds (default: [2, 6]) */
  speedRange?: [number, number];
}

/**
 * Pure-CSS starfield — no WebGL, no canvas.
 *
 * Performance:
 *   - All animation is CSS `opacity` keyframes (GPU-composited, no reflow).
 *   - `pointer-events: none` + `position: fixed` keeps it off the main thread.
 *   - Deterministic mulberry32 PRNG so SSR === client (no hydration mismatch).
 *
 * Inspired by: Kashan-2912/modern-portfolio starfield backdrop.
 */
export default function StarField({
  count = 80,
  className = '',
  seed = 7,
  sizeRange = [0.5, 2],
  speedRange = [2, 6],
}: StarFieldProps) {
  const stars = useMemo(() => {
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

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${rng() * 100}%`,
      top: `${rng() * 100}%`,
      size: sizeRange[0] + rng() * (sizeRange[1] - sizeRange[0]),
      delay: rng() * 5,
      duration: speedRange[0] + rng() * (speedRange[1] - speedRange[0]),
      // 30% of stars get a warm tint for variety
      warm: rng() < 0.3,
    }));
  }, [count, seed, sizeRange, speedRange]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.warm ? '#fbbf24' : '#fafaf9',
            boxShadow: `0 0 ${s.size * 2}px ${s.warm ? 'rgba(251, 191, 36, 0.6)' : 'rgba(250, 250, 249, 0.5)'}`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
