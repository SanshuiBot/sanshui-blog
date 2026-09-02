'use client';
import dynamic from 'next/dynamic';
import type { HeroStats } from './HeroParallax';

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
 * - HeroParallax / PostsList 的 RSC payload 不再被序列化进首页 HTML
 * - Hero 区不再阻塞首屏：先显示 Navbar，动效 chunk
 *   加载完后再飞入，体感「页面秒开，Hero 延迟飞入」而非「白屏等待」
 *
 * loading 骨架：Hero/Posts 在 chunk 加载期间显示一个极简占位
 * （一个 min-h 的透明块），避免布局跳动（CLS）。
 */
const HeroParallax = dynamic(() => import('@/components/Home/HeroParallax'), {
  ssr: false,
  loading: () => <div className="min-h-[100dvh]" aria-hidden />,
});

const PostsList = dynamic(() => import('@/components/Home/PostsList'), {
  ssr: false,
  loading: () => (
    <section id="posts" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" aria-hidden />
        ))}
      </div>
    </section>
  ),
});

export default function HomeHydration({ total, stats }: { total: number; stats: HeroStats }) {
  return (
    <>
      <HeroParallax stats={stats} />
      {/*
        第一屏占位：fixed Hero 在它下方显示。
        pointer-events-none 让点击穿透到 Hero 里的 GitHub/邮件按钮；
        h-[var(--sansui-hero-vh)] 与 Hero 组件内部用同一份 JS 快照值，
        彻底规避移动端 Safari 100dvh 随地址栏显隐动态变化导致的重叠问题
        （CSS dvh ≠ window.innerHeight，两者不同步时标题与列表会短暂重叠）。
      */}
      <div className="relative z-10 h-[var(--sansui-hero-vh,100dvh)] pointer-events-none" aria-hidden />
      <PostsList total={total} />
    </>
  );
}
