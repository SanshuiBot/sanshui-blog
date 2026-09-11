'use client';
import { useEffect, useState } from 'react';

/**
 * body 滚动锁状态检测 —— 进度组件（ScrollProgress / ReadingProgress）共用。
 * -----------------------------
 * 判锁依据：useScrollLock（全站唯一滚动锁实现）锁定时必置
 * `document.body.style.overflow = 'hidden'`（iOS 额外 fixed，Android 仅 overflow）。
 * 据此判锁比监听 scrollY 可靠——Android 纯 overflow 锁不触发 scrollY 变化，
 * iOS fixed 锁会把 scrollY 重置为 0（正是进度条「清空」的来源）。
 */
export function isBodyScrollLocked(): boolean {
  // typeof 守卫：客户端组件会被服务端预渲染（如 ReadingProgress 在文章页），
  // useState 惰性初始化会在 SSR 执行本函数——无 document 必须安全返回 false
  return typeof document !== 'undefined' && document.body.style.overflow === 'hidden';
}

/**
 * 订阅 body 滚动锁状态（布尔，re-render 随锁变化）。
 * MutationObserver 监听 body 的 style 属性变化：弹窗/抽屉开合即同步，
 * 不依赖 scroll 事件（开合瞬间 scroll 事件不可靠）。
 */
export function useIsBodyScrollLocked(): boolean {
  const [locked, setLocked] = useState(isBodyScrollLocked);

  useEffect(() => {
    const sync = () => setLocked(isBodyScrollLocked());
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, []);

  return locked;
}
