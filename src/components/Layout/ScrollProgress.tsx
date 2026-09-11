'use client';
import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/components/UI/usePrefersReducedMotion';
import { useIsBodyScrollLocked, isBodyScrollLocked } from '@/components/UI/useIsBodyScrollLocked';
import { calcScrollProgress } from '@/lib/scroll-progress';

export default function ScrollProgress() {
  const { scrollY } = useScroll();
  // 进度不直接渲染 framer 的 scrollYProgress：它对分母（文档可滚高度）无判零
  // 防护——iOS 上弹窗 fixed 滚动锁会让 scrollHeight 塌缩到一屏高，分母归零时
  // 进度被 clamp 成 1，「进度条瞬间填满」（历史 bug）。这里把 scrollY 过一遍
  // 判零纯函数；且滚动锁生效期间（body overflow=hidden）scrollY 会被重置为 0
  // （iOS fixed 锁），必须冻结上次值而非重算——否则打开/关闭弹窗、抽屉时
  // 进度条瞬间清空再恢复（用户反馈，视觉上像页面滑动了）。transform 输出
  // MotionValue，更新不进 React 渲染循环（滚动热路径零 re-render）；注意
  // useSpring 的源必须是 MotionValue——传普通 number 只会被当作初始值，
  // spring 永不更新（已踩坑，勿改回）。
  const lastRef = useRef(0);
  const progress = useTransform(scrollY, (v) => {
    if (isBodyScrollLocked()) return lastRef.current;
    lastRef.current = calcScrollProgress(
      v,
      document.documentElement.scrollHeight,
      window.innerHeight,
    );
    return lastRef.current;
  });
  // 功能性指示条保留；prefers-reduced-motion 下去掉 spring 平滑，直接跟随滚动
  // 自研 matchMedia 订阅替代 framer useReducedMotion：避免设备开启 reduced-motion 时
  // framer-motion 的 dev warnOnce 警告（"reduced-motion-disabled"）
  const spring = useSpring(progress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const reduced = usePrefersReducedMotion();
  const locked = useIsBodyScrollLocked();
  const scaleX = reduced ? progress : spring;
  return (
    <motion.div
      className="fixed top-0 inset-x-0 z-[60] h-[2px] origin-left pointer-events-none"
      // 弹层打开时进度条淡出（等效「压到弹层之下」）：层级上无法真正降到
      // 抽屉(z-40)之下——header(z-50) 的 .nav-dotted 底色不透明会盖住进度条；
      // 用 opacity 0 达到相同视觉效果，值已冻结，关闭后原位恢复无跳变
      animate={{ opacity: locked ? 0 : 1 }}
      transition={{ duration: 0.15 }}
      style={{
        scaleX,
        background:
          'linear-gradient(90deg,rgb(var(--accent-pink-rgb)),rgb(var(--accent-violet-rgb)),rgb(var(--accent-blue-rgb)))',
      }}
    />
  );
}
