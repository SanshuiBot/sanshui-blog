'use client';
import { useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { spotlightMove } from '@/lib/spotlight';

/**
 * 3D tilt + 聚光坐标写入 —— 仅在卡片可见时挂载。
 * -----------------------------
 * 光晕/文字染色本体已收口为纯 CSS（styles/spotlight.css，约定 #32/#40）：
 * 本组件只剩装饰性 JS 部分——3D tilt 弹簧（framer）+ mousemove 坐标分发
 * （lib/spotlight.ts：卡片根供光晕层、染色元素各自盒供染色层）。
 * 作为无渲染辅助组件：挂载后通过 onRefs 回调向父组件暴露引用，
 * 避免骨架槽位（skeleton=true）也创建 Spring 实例。
 * 约定 #21：cleanup 调 onRefs(null) 使 StrictMode 双执行下幂等，Spring 实例可被 GC。
 */
export interface SpotlightRefs {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onMove: (e: React.MouseEvent) => void;
  onLeave: () => void;
}

/**
 * props 用具名 interface 而非内联类型字面量：Next.js TS 插件（client-boundary 规则）
 * 只检查内联字面量中的函数类型 prop，会误报 onRefs「不是 Server Action」——
 * 但 onRefs 是纯客户端回调，仅被同为 client 组件的 PostCard 使用，永不跨 Server/Client 边界。
 */
interface CardSpotlightProps {
  ref: React.RefObject<HTMLDivElement | null>;
  onRefs: (refs: SpotlightRefs | null) => void;
}

export default function CardSpotlight({ ref: outerRef, onRefs }: CardSpotlightProps) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 15 });
  const sry = useSpring(ry, { stiffness: 120, damping: 15 });

  useEffect(() => {
    onRefs({
      rotateX: srx,
      rotateY: sry,
      onMove: (e: React.MouseEvent) => {
        const el = outerRef.current;
        if (!el) return;
        // 共享坐标写入（卡片根 + 染色元素各自盒）；返回的 rect 复用来算 tilt，少读一次布局
        const r = spotlightMove(el, e, '.post-card-title-inner, .post-card-readmore-inner');
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * 5);
        rx.set(-(py - 0.5) * 5);
      },
      onLeave: () => {
        // 只回正 tilt；--mx/--my 不复位（渐变仅在 hover 时可见，原地淡出防「闪一次」）
        rx.set(0);
        ry.set(0);
      },
    });
    // 约定 #21：StrictMode 双执行下，cleanup 将引用置 null，
    // 使第二次 mount 可安全覆盖，且首次 mount 的实例可被 GC。
    return () => onRefs(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // onRefs is stable (function ref), dependencies intentionally empty

  return null;
}
