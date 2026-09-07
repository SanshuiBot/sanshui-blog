'use client';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { usePrefersReducedMotion } from '@/components/UI/usePrefersReducedMotion';

const CursorGlow = dynamic(() => import('@/components/UI/CursorGlow'), { ssr: false });
const ScrollProgress = dynamic(() => import('@/components/Layout/ScrollProgress'), { ssr: false });
const ClickEffect = dynamic(() => import('@/components/UI/ClickEffect'), { ssr: false });
const ParticleField = dynamic(() => import('@/components/UI/ParticleField'), { ssr: false });

/**
 * 全局常驻动效注册表。
 *
 * 4 个动效的懒加载入口统一在这里，新增效果只加一行 dynamic 注册即可。
 * prefers-reduced-motion 阀门：装饰性动效（CursorGlow、ClickEffect）整体跳过；
 * ScrollProgress 是功能性指示条，保留但组件内对 spring 平滑入阀；
 * ParticleField 内部自检（reduced 下只画一帧静态画面）。
 * HeroParallax 是首页专属首屏组件，由 HomeHydration 独立加载，不在此注册表内。
 *
 * 阅读场景收窄：文章详情页（/posts/...）跳过 ParticleField 与 ClickEffect——
 * 纯阅读页面不需要粒子背景/点击特效，动效 chunk 不下载、不运行（省电+专注）；
 * CursorGlow 保留但组件内已做 idle 停帧（见 CursorGlow.tsx）。
 */
export default function AmbientEffects() {
  // usePrefersReducedMotion：matchMedia 是外部 store，避免 effect 内同步 setState
  const reduced = usePrefersReducedMotion();
  // 文章详情页：跳过装饰性动效（阅读场景专注 + 省电）
  const pathname = usePathname();
  const isArticle = pathname.startsWith('/posts/');

  // 装饰性动效（光晕、点击特效）对 prefers-reduced-motion 用户整体跳过；
  // 文章页额外跳过粒子背景与点击特效；
  // ScrollProgress（功能性，spring 平滑入阀）与 ParticleField（内部自检静态帧）保留
  return (
    <>
      {reduced ? null : <CursorGlow />}
      {reduced || isArticle ? null : <ClickEffect />}
      <ScrollProgress />
      {isArticle ? null : <ParticleField />}
    </>
  );
}
