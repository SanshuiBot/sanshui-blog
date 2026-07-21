'use client';

import { useRef, isValidElement, Children } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur' | 'none';
  threshold?: number;
  staggerChildren?: boolean;
  staggerAmount?: number;
  duration?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.1,
  staggerChildren = false,
  staggerAmount = 0.05,
  duration = 0.6,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px', amount: threshold });

  const directionOffset = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
    scale: { scale: 0.85, y: 20 },
    blur: { y: 20, filter: 'blur(8px)' },
    none: {},
  };

  const baseTransition = {
    duration,
    delay,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  if (staggerChildren) {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={baseTransition}
      >
        {Children.map(children as React.ReactNode[], (child, index) => {
          if (!isValidElement(child)) return child;
          return (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                ...directionOffset[direction],
              }}
              animate={
                isInView
                  ? { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }
                  : { opacity: 0, ...directionOffset[direction] }
              }
              transition={{
                ...baseTransition,
                delay: delay + index * staggerAmount,
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...directionOffset[direction],
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }
          : { opacity: 0, ...directionOffset[direction] }
      }
      transition={baseTransition}
    >
      {children}
    </motion.div>
  );
}
