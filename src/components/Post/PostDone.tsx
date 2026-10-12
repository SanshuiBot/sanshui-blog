'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 文章详情页挂载后清理跨文章跳转残留的 URL hash（P2-21）：
 * 上一篇文章 TOC 点击写入的 #锚点在新文章里大概率不存在，保留会让
 * 浏览器在 hydrate 后尝试定位到不存在的锚点、URL 也显得脏。
 *
 * 修复边界：只在 hash 对应元素确实不存在时才清除，避免误清新文章内同名的有效锚点。
 *
 * 注：导航完成信号（等待胶囊隐藏）已由 NavigationLoadingProvider 的 pathname
 * 变化统一收口，本组件不再负责 done()。
 */
export default function PostDone({ slug }: { slug: string }) {
  const pathname = usePathname();
  const lastHashRef = useRef<string | null>(null);

  useEffect(() => {
    const currentHash = window.location.hash;
    if (currentHash && currentHash !== lastHashRef.current) {
      const id = currentHash.slice(1);
      if (id && !document.getElementById(id)) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      lastHashRef.current = currentHash;
    }
  }, [slug, pathname]);

  return null;
}
