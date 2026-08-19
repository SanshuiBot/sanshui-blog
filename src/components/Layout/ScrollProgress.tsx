'use client';
import { motion, useScroll, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '@/components/UI/usePrefersReducedMotion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  // 功能性指示条保留；prefers-reduced-motion 下去掉 spring 平滑，直接跟随滚动
  // 自研 matchMedia 订阅替代 framer useReducedMotion：避免设备开启 reduced-motion 时
  // framer-motion 的 dev warnOnce 警告（"reduced-motion-disabled"）
  const spring = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const reduced = usePrefersReducedMotion();
  const scaleX = reduced ? scrollYProgress : spring;
  return (
    <motion.div
      className="fixed top-0 inset-x-0 z-[60] h-[2px] origin-left pointer-events-none"
      style={{
        scaleX,
        background:
          'linear-gradient(90deg,rgb(var(--accent-pink-rgb)),rgb(var(--accent-violet-rgb)),rgb(var(--accent-blue-rgb)))',
      }}
    />
  );
}
