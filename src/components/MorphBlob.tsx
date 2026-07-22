'use client';

import { motion } from 'framer-motion';

interface MorphBlobProps {
  className?: string;
  color?: string;
  size?: number;
  duration?: number;
}

export default function MorphBlob({
  className = '',
  color = 'rgba(244, 114, 182, 0.15)',
  size = 300,
  duration = 12,
}: MorphBlobProps) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: 'blur(40px)',
        willChange: 'transform',
      }}
      animate={{
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '30% 60% 70% 40% / 50% 60% 30% 60%',
          '60% 40% 60% 40% / 40% 60% 40% 60%',
          '40% 60% 30% 70% / 60% 40% 60% 40%',
          '60% 40% 30% 70% / 60% 30% 70% 40%',
        ],
        scale: [1, 1.08, 0.95, 1.05, 1],
        rotate: [0, 30, -20, 10, 0],
        opacity: [0.6, 0.8, 0.5, 0.7, 0.6],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}
