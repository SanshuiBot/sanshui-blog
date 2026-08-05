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
 * 对 prefers-reduced-motion 用户跳过装饰性动效（仅 CursorGlow 受门控）；
 * 点击特效（ClickEffect）与功能性动效（ScrollProgress）保持运行，
 * 已自检的动效（ParticleField 内部处理）同样保持运行。
 */
export default function AmbientEffects() {
  // useSyncExternalStore：matchMedia 是外部 store，避免 effect 内同步 setState
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false, // SSR 快照：默认非 reduced
  );

  // 服务端渲染阶段（ssr:false → 渲染 null）与 reduced-motion 用户跳过光标光晕；
  // 点击特效始终显示，不受 prefers-reduced-motion 门控影响
  return (
    <>
      {reduced ? null : <CursorGlow />}
      <ClickEffect />
      <ScrollProgress />
      <ParticleField />
    </>
  );
}
