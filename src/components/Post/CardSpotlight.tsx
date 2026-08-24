'use client';
import { useEffect } from 'react';
import { useMotionValue, useMotionTemplate, useSpring } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

/**
 * 鼠标跟随 spotlight + 3D tilt —— 仅在卡片可见时挂载。
 * -----------------------------
 * 作为无渲染辅助组件：挂载后通过 onRefs 回调向父组件暴露 MotionValue 引用，
 * 避免骨架槽位（skeleton=true）也创建 MotionValue/Spring 实例。
 * 约定 #32：此效果为装饰性 JS 动画，受 AmbientEffects reduced-motion 阀门全局控制。
 */
export interface SpotlightRefs {
  spotlight: MotionValue<string>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onMove: (e: React.MouseEvent) => void;
  onLeave: () => void;
}

export default function CardSpotlight({
  ref: outerRef,
  onRefs,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  onRefs: (refs: SpotlightRefs) => void;
}) {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 100, damping: 20 });
  const sy = useSpring(my, { stiffness: 100, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(280px circle at ${sx}% ${sy}%, rgb(var(--accent-violet-rgb) / 0.22), rgb(var(--accent-pink-rgb) / 0.12) 30%, transparent 60%)`;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 15 });
  const sry = useSpring(ry, { stiffness: 120, damping: 15 });

  useEffect(() => {
    onRefs({
      spotlight,
      rotateX: srx,
      rotateY: sry,
      onMove: (e: React.MouseEvent) => {
        const el = outerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        mx.set(px * 100);
        my.set(py * 100);
        ry.set((px - 0.5) * 5);
        rx.set(-(py - 0.5) * 5);
      },
      onLeave: () => {
        mx.set(50);
        my.set(50);
        rx.set(0);
        ry.set(0);
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
