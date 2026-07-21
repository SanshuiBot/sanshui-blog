'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LightRayProps {
  children: ReactNode;
  className?: string;
  /** Sweep direction: 'horizontal' | 'vertical' | 'diagonal' (default: 'horizontal') */
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  /** Delay between sweeps in seconds (default: 4) */
  delayBetween?: number;
}

const DIRECTIONS = {
  horizontal: {
    style: { transform: 'skewX(-15deg)' },
    animate: { x: ['-150%', '250%'] },
  },
  vertical: {
    style: { transform: 'skewY(-15deg)' },
    animate: { y: ['-150%', '250%'] },
  },
  diagonal: {
    style: { transform: 'skew(-15deg, -15deg)' },
    animate: { x: ['-150%', '250%'], y: ['-150%', '250%'] },
  },
};

export default function LightRay({
  children,
  className = '',
  direction = 'horizontal',
  delayBetween = 4,
}: LightRayProps) {
  const config = DIRECTIONS[direction];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Ray sweep overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          ...config.style,
        }}
        animate={config.animate}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: delayBetween,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
