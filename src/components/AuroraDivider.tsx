'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface AuroraDividerProps {
  height?: number;
  className?: string;
  colors?: string[];
  /** Show the thin bright line through the center (default: true) */
  showLine?: boolean;
}

const DEFAULT_COLORS = [
  'rgba(244, 114, 182, 0.3)',
  'rgba(192, 132, 252, 0.25)',
  'rgba(96, 165, 250, 0.3)',
  'rgba(52, 211, 153, 0.2)',
  'rgba(251, 191, 36, 0.25)',
];

export default function AuroraDivider({
  height = 80,
  className = '',
  colors = DEFAULT_COLORS,
  showLine = true,
}: AuroraDividerProps) {
  // Create reversed copy without mutating the original array
  const reversedColors = useMemo(() => [...colors].reverse(), [colors]);

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {/* Primary aurora layer */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${colors.join(', ')})`,
          filter: 'blur(30px)',
        }}
        animate={{
          x: ['-20%', '20%'],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary aurora layer (opposite direction) */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(270deg, ${reversedColors.join(', ')})`,
          filter: 'blur(20px)',
        }}
        animate={{
          x: ['20%', '-20%'],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Tertiary accent layer */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent, ${colors[0]?.replace(/[0-9.]+\)$/, '0.15)')}, transparent)`,
          filter: 'blur(40px)',
        }}
        animate={{
          y: ['-10%', '10%'],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Thin bright line */}
      {showLine && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: '50%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors[0]}, ${colors[2] ?? colors[1]}, ${colors[4] ?? colors[colors.length - 1]}, transparent)`,
          }}
        />
      )}
    </div>
  );
}
