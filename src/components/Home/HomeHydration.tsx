'use client';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import type { HeroStats } from './HeroParallax';
import { useReloadScrollRestore } from './useReloadScrollRestore';

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
 * - framer-motion 整包移出首屏入口 chunk（实测仅存在于懒加载 chunk：SearchModal /
 *   Hero / Posts 的 dynamic import 共享同一份 framer chunk，首屏 HTML 不引用）
 * - HeroParallax / PostsList 的 RSC payload 不再被序列化进首页 HTML
 * - Hero 区不再阻塞首屏：先显示 Navbar，动效 chunk
 *   加载完后再飞入，体感「页面秒开，Hero 延迟飞入」而非「白屏等待」
 *
 * loading 骨架：Hero/Posts 在 chunk 加载期间显示一个极简占位
 * （一个 min-h 的透明块），避免布局跳动（CLS）。
 */
const HeroParallax = dynamic(() => import('@/components/Home/HeroParallax'), {
  ssr: false,
  loading: () => <div className="min-h-[var(--sansui-hero-vh,100dvh)]" aria-hidden />,
});

const PostsList = dynamic(() => import('@/components/Home/PostsList'), {
  ssr: false,
  loading: () => (
    <section id="posts" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-2xl bg-black/[0.03] animate-pulse dark:bg-white/5"
            aria-hidden
          />
        ))}
      </div>
    </section>
  ),
});

export default function HomeHydration({ total, stats }: { total: number; stats: HeroStats }) {
  // 刷新滚动还原：内容全部异步渲染，原生滚动恢复会被 clamp 到顶部（见 hook 文件头）
  useReloadScrollRestore();

  // 水合后写入 --sansui-hero-vh 快照（loading 占位与前景 min-h 共享该变量），
  // 把活值 100dvh 固定为 JS 快照——规避 iOS Safari 地址栏显隐导致 100dvh 动态
  // 变化、占位与前景高度脱钩。用 useEffect（非 useLayoutEffect）：本组件被服务端
  // 组件直接 import 会经历 SSR，useLayoutEffect 在 server 端会报
  // "does nothing on the server" 警告；首帧前 100dvh fallback 的窗口极短
  // （同一次 hydrate 批处理内 effect 即触发写入），可接受。
  // resize 监听只写 CSS 变量（不 setState），无重渲染。
  // HeroParallax 挂载后由它自带的监听覆盖（同一内联值写入，不冲突）。
  useEffect(() => {
    const syncVar = () => {
      document.documentElement.style.setProperty('--sansui-hero-vh', `${window.innerHeight}px`);
    };
    syncVar();
    window.addEventListener('resize', syncVar);
    return () => {
      window.removeEventListener('resize', syncVar);
      // chunk 加载失败（HeroParallax 永不挂载）或组件卸载时移除变量，避免跨路由残留
      document.documentElement.style.removeProperty('--sansui-hero-vh');
    };
  }, []);

  return (
    <>
      <HeroParallax stats={stats} />
      {/*
        Hero 前景在文档流内（背景层 fixed），高度由组件自身的
        min-h-[var(--sansui-hero-vh,100dvh)] 提供——chunk 加载期间由上方
        loading 占位（同样用该变量）撑住首屏，无需额外 spacer。
      */}
      <PostsList total={total} />
    </>
  );
}
