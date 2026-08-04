'use client';
import { useEffect, useRef, type RefObject } from 'react';

interface UseDismissOptions {
  /** 弹层关闭时是否完全不绑定监听（默认 true） */
  enabled?: boolean;
  /** 是否响应 Esc 关闭（默认 true） */
  esc?: boolean;
  /** 是否响应点击外部关闭（默认 true；开关按钮在浮层外的场景须关闭，见 Navbar 移动菜单） */
  outside?: boolean;
}

/**
 * 弹层通用关闭逻辑：点击外部 / Esc 关闭。
 *
 *  - 外点判定：mousedown 且目标不在 ref 容器内（ref 须包裹「开关按钮 + 浮层」，
 *    否则点击开关会被误判为外点，与按钮 onClick 形成开关竞态）
 *  - 延迟绑定：setTimeout(0) 跳过「触发弹层打开的同一次点击」这个坑
 *  - onClose 用 ref 持有，避免调用方内联箭头导致每次渲染重绑监听
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  { enabled = true, esc = true, outside = true }: UseDismissOptions = {},
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    // 延迟到下一轮事件循环再绑定，避开触发弹层打开的同一次点击
    const timer = setTimeout(() => {
      if (outside) document.addEventListener('mousedown', onMouseDown);
      if (esc) document.addEventListener('keydown', onKeyDown);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, enabled, esc, outside]);
}
