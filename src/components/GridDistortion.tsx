'use client';

import { useMemo } from 'react';

interface GridDistortionProps {
  className?: string;
  /** Grid cell size in px (default: 56) */
  cellSize?: number;
  /** Seed for reproducible distortion */
  seed?: number;
}

/**
 * Animated grid distortion — a perspective grid that subtly warps.
 *
 * Pure CSS + SVG, no WebGL. Performance:
 *   - Only `transform: perspective()` + `rotateX` on the container (GPU).
 *   - SVG lines are static; animation comes from the container transform.
 *   - `pointer-events: none` + `position: fixed`.
 *
 * Inspired by: Kashan-2912/modern-portfolio blueprint grid aesthetic.
 */
export default function GridDistortion({
  className = '',
  cellSize = 56,
  seed = 23,
}: GridDistortionProps) {
  // Deterministic shimmer phase
  const phase = useMemo(() => {
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
    return makeRng(seed + 1)();
  }, [seed]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
      style={{
        perspective: '600px',
        perspectiveOrigin: '50% 50%',
        opacity: 0.18,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          transformStyle: 'preserve-3d',
          animation: `grid-drift 24s linear infinite`,
          animationDelay: `${phase}s`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <pattern
              id="grid-distortion-pattern"
              width={cellSize}
              height={cellSize}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                style={{ color: 'var(--text-primary)' }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-distortion-pattern)" />
        </svg>
      </div>
      <style>{`
        @keyframes grid-drift {
          0% { transform: rotateX(60deg) rotateZ(0deg) translateY(0); }
          50% { transform: rotateX(62deg) rotateZ(180deg) translateY(-4%); }
          100% { transform: rotateX(60deg) rotateZ(360deg) translateY(0); }
        }
      `}</style>
    </div>
  );
}
