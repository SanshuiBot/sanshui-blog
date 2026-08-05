'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const CursorGlow = dynamic(() => import('@/components/UI/CursorGlow'), { ssr: false });
const ScrollProgress = dynamic(() => import('@/components/Layout/ScrollProgress'), { ssr: false });
const ClickEffect = dynamic(() => import('@/components/UI/ClickEffect'), { ssr: false });
const ParticleField = dynamic(() => import('@/components/UI/ParticleField'), { ssr: false });

/**
 * 全局常驻动效注册表。
 *
 * 4 个动效的懒加载入口统一在这里，新增效果只加一行 dynamic 注册即可。
 * 对 prefers-reduced-motion 用户跳过装饰性动效（仅 CursorGlow 受门控）；
 * 点击特效（ClickEffect）与功能性动效（ScrollProgress）保持运行，
 * 已自检的动效（ParticleField 内部处理）同样保持运行。
 */
export default function AmbientEffects() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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
