'use client';

import dynamic from 'next/dynamic';

/**
 * 首屏动效组件懒加载入口（client wrapper）。
 *
 * 为什么需要这层 wrapper：
 * `next/dynamic` 的 `ssr: false` 选项**只能在 client component 里使用**——
 * 在 server component（如 src/app/page.tsx）里写 `dynamic(..., { ssr: false })`
 * 会被 Next 16 构建期拒绝（`ssr: false` is not allowed with `next/dynamic`
 * in Server Components）。因此把「需要 ssr:false 的 dynamic import」集中到
 * 这个 client wrapper 里，再由 server component 引用本文件。
 *
 * 收益：
 * - framer-motion 整包移出首屏 chunk（约 332KB 未压缩 → 砍约 107KB gzip）
 * - HeroScene / StatsGrid 的 RSC payload 不再被序列化进首页 HTML
 *   （首页 HTML gzip 体积从 141KB 大幅下降）
 * - Hero 区不再阻塞首屏：先显示 Navbar + 文章列表骨架，动效 chunk
 *   加载完后再飞入，体感「页面秒开，Hero 延迟飞入」而非「白屏等待」
 *
 * loading 骨架：Hero/Stats 在 chunk 加载期间显示一个极简占位
 * （一个 min-h 的透明块），避免布局跳动（CLS）。
 */
const HeroScene = dynamic(() => import('@/components/Home/HeroScene'), {
  ssr: false,
  loading: () => <div className="min-h-[100dvh]" aria-hidden />,
});

const StatsGrid = dynamic(() => import('@/components/Home/StatsGrid'), {
  ssr: false,
  loading: () => <div className="h-[8rem]" aria-hidden />,
});

export default function HomeHydration() {
  return (
    <>
      <HeroScene />
      <StatsGrid />
    </>
  );
}
