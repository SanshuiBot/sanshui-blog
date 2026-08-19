'use client';
import { useSyncExternalStore } from 'react';

/** 订阅 prefers-reduced-motion 变化（matchMedia 外部 store 订阅） */
function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * prefers-reduced-motion 订阅 hook —— 统一「matchMedia 外部 store + useSyncExternalStore」仪式。
 *
 * 之前 AmbientEffects / ScrollProgress 各自手写同一段订阅（query 字符串、事件订阅、
 * SSR 快照），改一处漏一处会静默分叉。集中后契约只有这一份。
 *
 * 返回布尔快照：客户端实时反映系统设置；SSR 快照固定 false（默认非 reduced），
 * 避免 hydration 不一致。
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false, // SSR 快照：默认非 reduced
  );
}
