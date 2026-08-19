'use client';

import { useEffect } from 'react';
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
 */
export default function PostDone({ slug }: Props) {
  const { done } = useNavigationLoading();

  useEffect(() => {
    done();
    // 目标元素在新文章里不存在 → 移除残留 hash（replaceState 不留历史记录）
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      if (id && !document.getElementById(id)) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
    // slug 进依赖：App Router 在同一路由段内换参数时组件实例复用，
    // 只有 [done] 的话，文章间跳转不会重新 done()（覆盖层会挂到兜底 5s 才消失）
  }, [done, slug]);

  return null;
}
