'use client';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/components/UI/usePrefersReducedMotion';
import { calcScrollProgress } from '@/lib/scroll-progress';

export default function ScrollProgress() {
  const { scrollY } = useScroll();
  // 进度不直接渲染 framer 的 scrollYProgress：它对分母（文档可滚高度）无判零
  // 防护——iOS 上弹窗 fixed 滚动锁会让 scrollHeight 塌缩到一屏高，分母归零时
  // 进度被 clamp 成 1，「进度条瞬间填满」（历史 bug）。这里把 scrollY 过一遍
  // 判零纯函数：滚动锁挂载/卸载引发的 scrollY 跳变会触发重算，塌缩期算出 0、
  // 还原后恢复真值。transform 输出 MotionValue，更新不进 React 渲染循环
  // （滚动热路径零 re-render）；注意 useSpring 的源必须是 MotionValue——
  // 传普通 number 只会被当作初始值，spring 永不更新（已踩坑，勿改回）。
  const progress = useTransform(scrollY, (v) =>
    calcScrollProgress(v, document.documentElement.scrollHeight, window.innerHeight),
  );
  // 功能性指示条保留；prefers-reduced-motion 下去掉 spring 平滑，直接跟随滚动
  // 自研 matchMedia 订阅替代 framer useReducedMotion：避免设备开启 reduced-motion 时
  // framer-motion 的 dev warnOnce 警告（"reduced-motion-disabled"）
  const spring = useSpring(progress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const reduced = usePrefersReducedMotion();
  const scaleX = reduced ? progress : spring;
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
