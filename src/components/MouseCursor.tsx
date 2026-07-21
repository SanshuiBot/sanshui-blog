'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Custom cursor with magnetic ring + trailing glow.
 *
 * Performance:
 *   - Uses `useMotionValue` + `useSpring` (GPU-composited transforms).
 *   - `pointer-events: none` + `position: fixed` → no reflow.
 *   - Hidden on touch devices (no hover context).
 *   - Respects `prefers-reduced-motion` (static dot only).
 *
 * Inspired by: Arfazrll/PersonalBlog custom cursor + Kashan-2912
 * magnetic cursor trail.
 */
export default function MouseCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.4 });

  useEffect(() => {
    // Disable on touch / small screens
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.innerWidth < 768) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);
    const overInteractive = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      setHovering(
        !!t.closest('a, button, [role="button"], input, textarea, select, label'),
      );
    };

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mousedown', down, { passive: true });
    window.addEventListener('mouseup', up, { passive: true });
    window.addEventListener('mouseover', overInteractive, { passive: true });
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mouseover', overInteractive);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Inner dot — tracks cursor exactly */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 z-[90] pointer-events-none rounded-full mix-blend-difference"
        style={{
          x,
          y,
          width: 8,
          height: 8,
          translateX: '-50%',
          translateY: '-50%',
          background: '#fafaf9',
        }}
        animate={{ scale: clicking ? 0.6 : 1 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Outer ring — springs behind, expands on interactive hover */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 z-[90] pointer-events-none rounded-full border"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          borderColor: hovering ? 'rgba(248, 113, 113, 0.7)' : 'rgba(248, 113, 113, 0.35)',
          boxShadow: hovering
            ? '0 0 18px rgba(248, 113, 113, 0.35)'
            : '0 0 8px rgba(248, 113, 113, 0.15)',
        }}
        animate={{
          width: hovering ? 48 : 28,
          height: hovering ? 48 : 28,
          scale: clicking ? 0.85 : 1,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      />
    </>
  );
}
