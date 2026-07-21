'use client';

import { useMemo } from 'react';

interface SparkleProps {
  /** Number of sparkles (default: 12) */
  count?: number;
  className?: string;
  /** Seed for reproducible random positions */
  seed?: number;
  /** Size range: [min, max] in pixels (default: [2, 6]) */
  sizeRange?: [number, number];
  /** Hue range: [min, max] degrees (default: [280, 360] for pink-purple) */
  hueRange?: [number, number];
}

export default function Sparkles({
  count = 12,
  className = '',
  seed = 0,
  sizeRange = [2, 6],
  hueRange = [280, 360],
}: SparkleProps) {
  const sparkles = useMemo(() => {
    // mulberry32: deterministic integer-based PRNG.
    // Pure integer math avoids the floating-point drift that Math.sin-based
    // generators exhibit across Node.js vs browser JS engines, which would
    // otherwise cause hydration mismatches.
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
      left: `${5 + rng() * 90}%`,
      top: `${5 + rng() * 90}%`,
      size: sizeRange[0] + rng() * (sizeRange[1] - sizeRange[0]),
      delay: rng() * 3,
      duration: 1.5 + rng() * 2,
      hue: hueRange[0] + rng() * (hueRange[1] - hueRange[0]),
    }));
  }, [count, seed, sizeRange, hueRange]);

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: `hsl(${s.hue}, 80%, 75%)`,
            boxShadow: `0 0 ${s.size * 3}px hsl(${s.hue}, 80%, 75%)`,
            animation: `sparkle 2s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
