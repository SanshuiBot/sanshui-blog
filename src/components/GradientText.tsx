'use client';

import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  mode?: GradientMode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to animate the gradient (default: true, except for 'sunset') */
  animated?: boolean;
}

type GradientMode = 'holo' | 'rainbow' | 'sunset' | 'aurora';

const MODES: Record<GradientMode, string> = {
  holo: 'linear-gradient(225deg, #f472b6 0%, #c084fc 16%, #60a5fa 33%, #34d399 50%, #fbbf24 66%, #f87171 83%, #f472b6 100%)',
  rainbow: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)',
  sunset: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #fbbf24 100%)',
  aurora: 'linear-gradient(225deg, #f472b6 0%, #c084fc 25%, #60a5fa 50%, #34d399 75%, #fbbf24 100%)',
};

const SIZES: Record<string, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl lg:text-5xl',
  xl: 'text-4xl sm:text-5xl lg:text-7xl',
};

export default function GradientText({
  children,
  className = '',
  mode = 'holo',
  size = 'md',
  animated,
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
        animation: isAnimated
          ? 'holo-shift 6s linear infinite, fade-up 0.6s var(--ease-out-expo) both'
          : 'fade-up 0.6s var(--ease-out-expo) both',
        opacity: 0,
      }}
    >
      {children}
    </span>
  );
}
