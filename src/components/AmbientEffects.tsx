'use client';
import { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';

const CursorGlow = dynamic(() => import('@/components/UI/CursorGlow'), { ssr: false });
const ScrollProgress = dynamic(() => import('@/components/Layout/ScrollProgress'), { ssr: false });
const ClickEffect = dynamic(() => import('@/components/UI/ClickEffect'), { ssr: false });
const ParticleField = dynamic(() => import('@/components/UI/ParticleField'), { ssr: false });

/** 订阅 prefers-reduced-motion 变化（matchMedia 外部 store 订阅） */
function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * 全局常驻动效注册表。
 *
 * 4 个动效的懒加载入口统一在这里，新增效果只加一行 dynamic 注册即可。
 * prefers-reduced-motion 阀门：装饰性动效（CursorGlow、ClickEffect）整体跳过；
 * ScrollProgress 是功能性指示条，保留但组件内对 spring 平滑入阀；
 * ParticleField 内部自检（reduced 下只画一帧静态画面）。
 * HeroParallax 是首页专属首屏组件，由 HomeHydration 独立加载，不在此注册表内。
 */
export default function AmbientEffects() {
  // useSyncExternalStore：matchMedia 是外部 store，避免 effect 内同步 setState
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false, // SSR 快照：默认非 reduced
  );

  // 装饰性动效（光晕、点击特效）对 prefers-reduced-motion 用户整体跳过；
  // ScrollProgress（功能性，spring 平滑入阀）与 ParticleField（内部自检静态帧）保留
  return (
    <>
      {reduced ? null : <CursorGlow />}
      {reduced ? null : <ClickEffect />}
      <ScrollProgress />
      <ParticleField />
    </>
  );
}
