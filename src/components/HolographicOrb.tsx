'use client';

import { motion } from 'framer-motion';

interface HolographicOrbProps {
  /** Orb diameter in pixels */
  size?: number;
  className?: string;
  /** Hue angle for the primary color (0–360) */
  hue?: number;
  /** Animation speed in seconds (default: 8) */
  duration?: number;
  /** Show orbital ring decorations (default: false) */
  rings?: boolean;
}

export default function HolographicOrb({
  size = 200,
  className = '',
  hue = 0,
  duration = 8,
  rings = false,
}: HolographicOrbProps) {
  const nextHue = (hue + 60) % 360;
  const farHue = (hue + 120) % 360;

  return (
    <div className={`absolute pointer-events-none ${className}`} aria-hidden="true">
      <motion.div
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 30%,
            hsla(${hue}, 80%, 70%, 0.25),
            hsla(${nextHue}, 80%, 60%, 0.15) 40%,
            hsla(${farHue}, 80%, 50%, 0.08) 70%,
            transparent 100%
          )`,
          borderRadius: '50%',
          filter: 'blur(1px)',
          boxShadow: `
            0 0 ${size * 0.3}px hsla(${hue}, 80%, 60%, 0.15),
            inset 0 0 ${size * 0.2}px hsla(${farHue}, 80%, 70%, 0.1)
          `,
        }}
        animate={{
          scale: [1, 1.08, 0.95, 1],
          rotate: [0, 5, -3, 0],
          opacity: [0.6, 0.8, 0.5, 0.6],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbital rings */}
      {rings && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-white/10 pointer-events-none"
            style={{ margin: `-${size * 0.15}px` }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-white/5 pointer-events-none"
            style={{ margin: `-${size * 0.25}px` }}
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
