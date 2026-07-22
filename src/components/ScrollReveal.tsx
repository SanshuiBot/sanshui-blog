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
  distance?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children, className = '', delay = 0, direction = 'up', threshold = 0.1,
  staggerChildren = false, staggerAmount = 0.05, duration = 0.7, distance = 32, once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '0px 0px -60px 0px', amount: threshold });

  const offset = {
    up: { y: distance }, down: { y: -distance }, left: { x: distance }, right: { x: -distance },
    scale: { scale: 0.85, y: distance * 0.6 }, blur: { y: distance * 0.6, filter: 'blur(8px)' }, none: {},
  };
  const trans = { duration, delay, ease: [0.16, 1, 0.3, 1] as const };

  if (staggerChildren) {
    return (
      <motion.div ref={ref} className={className} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={trans}>
        {Children.map(children as React.ReactNode[], (child, index) => {
          if (!isValidElement(child)) return child;
          return <motion.div key={index} initial={{ opacity: 0, ...offset[direction] }} animate={isInView ? { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' } : {}} transition={{ ...trans, delay: delay + index * staggerAmount }}>{child}</motion.div>;
        })}
      </motion.div>
    );
  }

  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, ...offset[direction] }} animate={isInView ? { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' } : {}} transition={trans}>
      {children}
    </motion.div>
  );
}
