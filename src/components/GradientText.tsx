'use client';

import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  mode?: GradientMode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
  glow?: boolean;
}

type GradientMode = 'holo' | 'rainbow' | 'sunset' | 'aurora' | 'neon' | 'ice' | 'fire';

const MODES: Record<GradientMode, string> = {
  holo: 'linear-gradient(225deg, #f472b6 0%, #c084fc 16%, #60a5fa 33%, #34d399 50%, #fbbf24 66%, #f87171 83%, #f472b6 100%)',
  rainbow: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)',
  sunset: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #fbbf24 100%)',
  aurora: 'linear-gradient(225deg, #f472b6 0%, #c084fc 25%, #60a5fa 50%, #34d399 75%, #fbbf24 100%)',
  neon: 'linear-gradient(90deg, #f43f5e, #e879f9, #818cf8, #22d3ee)',
  ice: 'linear-gradient(135deg, #22d3ee 0%, #60a5fa 50%, #818cf8 100%)',
  fire: 'linear-gradient(135deg, #dc2626 0%, #f97316 50%, #fbbf24 100%)',
};

const SIZES: Record<string, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl lg:text-5xl',
  xl: 'text-4xl sm:text-5xl lg:text-7xl',
  '2xl': 'text-5xl sm:text-6xl lg:text-8xl',
};

export default function GradientText({
  children,
  className = '',
  mode = 'holo',
  size = 'md',
  animated,
  glow = false,
}: GradientTextProps) {
  const isAnimated = animated ?? mode !== 'sunset';

  return (
    <span
      className={`${SIZES[size]} font-bold tracking-tight ${className}`}
      style={{
        background: MODES[mode],
        backgroundSize: isAnimated ? '200% 100%' : '100% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent',
        filter: glow ? 'drop-shadow(0 0 12px rgba(244, 114, 182, 0.3)) drop-shadow(0 0 24px rgba(192, 132, 252, 0.15))' : 'none',
        animation: isAnimated ? 'holo-shift 6s linear infinite, fade-up 0.6s var(--ease-out-expo) both' : 'fade-up 0.6s var(--ease-out-expo) both',
        opacity: 0,
      }}
    >
      {children}
    </span>
  );
}
