'use client';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div className="fixed top-0 inset-x-0 z-[60] h-[2px] origin-left pointer-events-none"
      style={{ scaleX, background: 'linear-gradient(90deg,#ff6ec7,#a855f7,#38bdf8)' }} />
  );
}
