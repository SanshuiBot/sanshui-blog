'use client';
/**
 * SpotlightTilt — 全站卡片统一的 hover 3D tilt + 聚光坐标分发壳（约定 #40 收口）
 * -----------------------------
 * 消费方：文章卡 PostCard、上下篇卡 PostNav、项目卡 ProjectsContent、友链卡 LinksContent。
 *
 * 结构（两层）：
 *   外层 div（检测壳）——perspective + onMouseMove/onLeave 命中区 + CardSpotlight 挂载点；
 *     ref 与 CardSpotlight 同元素，spotlightMove() 按此盒写卡片根坐标（光晕/边框层消费），
 *     并对 dyedSelector 命中的染色元素按「各自盒」另写一份（lib/spotlight.ts 契约）。
 *   内层 motion.div（tilt 层）——rotateX/Y 弹簧（framer MotionValue 订阅，高频路径零渲染）；
 *     transformStyle: preserve-3d。卡面本体作为 children 放进 tilt 层，hover 3D 由壳统一提供。
 *
 * 使用约定：
 *   - children 内的聚光层（.spotlight-glow / .spotlight-border-glow / .spotlight-dye）
 *     样式与坐标消费全在 styles/spotlight.css，本组件只负责「壳 + 坐标写入」；
 *   - 卡面为不透明底色时，光晕层须排在内容壳之后（spotlight.css 不变量 4）；
 *   - enabled=false（PostCard 骨架槽位模式）：不挂 CardSpotlight、mousemove 置空——
 *     不创建 Spring/MotionValue 实例，同屏多张骨架卡零开销；
 *   - 卡面自有的纯 CSS hover 变色/位移照常写在卡面类上，与本壳的 tilt（transform）
 *     分属不同元素，互不覆盖（红线 #42/#53）。
 */
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import CardSpotlight from '@/components/Post/CardSpotlight';
import type { SpotlightRefs } from '@/components/Post/CardSpotlight';

interface SpotlightTiltProps {
  children: ReactNode;
  /** 染色元素选择器（传给 spotlightMove 的 dyedSelector），语义同 CardSpotlight */
  dyedSelector: string;
  /** tilt 最大角度（deg），默认 5 */
  maxTilt?: number;
  /** false 时不挂 CardSpotlight、坐标分发置空（骨架槽位省实例） */
  enabled?: boolean;
  /** 外层检测壳 class（hover 命中区 + 定位上下文，如 group spotlight-card relative h-full） */
  className?: string;
  /** 内层 tilt 层 class（卡面壳样式如 p-[1px] 背景渐变；默认 h-full 铺满壳） */
  tiltClassName?: string;
  /** 渲染在 tilt 层之后、检测壳之内的插槽——卡面为不透明底色时（PostCard）光晕层
      必须排在内容壳之后才透得出来（spotlight.css 不变量 4），经此传入 */
  glowSlot?: ReactNode;
  style?: CSSProperties;
}

export default function SpotlightTilt({
  children,
  dyedSelector,
  maxTilt = 5,
  enabled = true,
  className,
  tiltClassName,
  glowSlot,
  style,
}: SpotlightTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  // 用 state 存 refs（而非 ref.current）：CardSpotlight effect 调 onRefs 后触发重渲染，
  // 保证渲染期能安全访问 spotlight 值（同 PostCard 原模式）
  const [spotlight, setSpotlight] = useState<SpotlightRefs | null>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        if (enabled) spotlight?.onMove(e);
      }}
      onMouseLeave={() => spotlight?.onLeave()}
      className={className}
      style={{ perspective: '800px', ...style }}
    >
      {enabled && (
        <CardSpotlight
          ref={ref}
          onRefs={setSpotlight}
          dyedSelector={dyedSelector}
          maxTilt={maxTilt}
        />
      )}
      <motion.div
        className={tiltClassName ?? 'h-full'}
        style={{
          rotateX: spotlight?.rotateX ?? 0,
          rotateY: spotlight?.rotateY ?? 0,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
      {glowSlot}
    </div>
  );
}
