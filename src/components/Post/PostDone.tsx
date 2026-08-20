'use client';
import { useEffect, useRef } from 'react';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';

interface Props {
  /** 文章 slug：slug 变化（文章间跳转）时 effect 重跑 */
  slug: string;
}

/**
 * 挂载/换文章时通知覆盖层"页面内容已就绪"——仅用于文章详情页。
 * 同时清理跨文章跳转残留的 URL hash（P2-21）：
 * 上一篇文章 TOC 点击写入的 #锚点在新文章里大概率不存在，保留会让
 * 浏览器在 hydrate 后尝试定位到不存在的锚点、URL 也显得脏。
 *
 * 修复边界：只在 hash 对应元素确实不存在时才清除，避免误清新文章内同名的有效锚点。
 */
export default function PostDone({ slug }: Props) {
  const { done } = useNavigationLoading();
  const lastHashRef = useRef<string | null>(null);

  useEffect(() => {
    done();

    // 清除残留 hash：只在 hash 目标元素不存在时才清理（避免误清同名锚点）
    const currentHash = window.location.hash;
    if (currentHash && currentHash !== lastHashRef.current) {
      const id = currentHash.slice(1);
      if (id && !document.getElementById(id)) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      lastHashRef.current = currentHash;
    }
  }, [done, slug]);

  return null;
}
