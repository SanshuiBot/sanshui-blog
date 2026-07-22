'use client';

import { useMemo } from 'react';

interface StarFieldProps {
  count?: number;
  className?: string;
  seed?: number;
  sizeRange?: [number, number];
  speedRange?: [number, number];
}

/**
 * Enhanced CSS starfield with glow layers and warm/cool color variety.
 * Pure CSS opacity keyframes — GPU composited, no reflow.
 */
export default function StarField({
  count = 100,
  className = '',
  seed = 7,
  sizeRange = [0.5, 2],
  speedRange = [2, 6],
}: StarFieldProps) {
  const stars = useMemo(() => {
    const makeRng = (s: number) => {
      let a = s >>> 0;
      return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
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
      delay: rng() * 6,
      duration: speedRange[0] + rng() * (speedRange[1] - speedRange[0]),
      type: rng() < 0.25 ? 'warm' : rng() < 0.5 ? 'cool' : 'neutral',
      brightness: 0.5 + rng() * 0.5,
    }));
  }, [count, seed, sizeRange, speedRange]);

  const getStarStyle = (type: string, _size: number, brightness: number) => {
    switch (type) {
      case 'warm': return { bg: '#fbbf24', shadow: `rgba(251, 191, 36, ${0.4 * brightness})` };
      case 'cool': return { bg: '#60a5fa', shadow: `rgba(96, 165, 250, ${0.4 * brightness})` };
      default: return { bg: '#fafaf9', shadow: `rgba(250, 250, 249, ${0.3 * brightness})` };
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {stars.map((s) => {
        const style = getStarStyle(s.type, s.size, s.brightness);
        return (
          <div key={s.id} className="absolute" style={{
            left: s.left, top: s.top,
            width: `${s.size}px`, height: `${s.size}px`,
          }}>
            {/* Star core */}
            <div
              className="absolute rounded-full inset-0"
              style={{
                background: style.bg,
                boxShadow: `0 0 ${s.size * 3}px ${style.shadow}`,
                animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
            {/* Outer glow for bigger stars */}
            {s.size > 1.2 && (
              <div
                className="absolute rounded-full"
                style={{
                  inset: `-${s.size * 2}px`,
                  background: `radial-gradient(circle, ${style.bg}33, transparent 70%)`,
                  animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
                  opacity: 0.3,
                }}
              />
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
