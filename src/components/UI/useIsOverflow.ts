'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// 服务端时 useLayoutEffect 无意义，退化为 useEffect（同 Tooltip 的 isomorphic 处理）
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * useOverflow —— 实测元素内容是否溢出（被 truncate / line-clamp 截断）
 * ---------------------------------------------------------------
 * 给「截断感知的 Tooltip」用：mount 时（layout effect，首帧前）与窗口
 * resize 时各测一次，返回的 overflow 在第一次 mouseenter 之前就是正确值——
 * 不能放到 onMouseEnter 里测：同一事件批次里 setState 未提交，Tooltip 的
 * handleEnter 读到的 disabled 还是旧值，首次 hover 不会弹气泡。
 *
 * 容差 1px：scrollHeight/scrollWidth 向上取整、clientHeight/clientWidth
 * 向下取整，行高亚像素舍入可产生 ≤1px 的假溢出（如 min-height 撑高的短文本）。
 */
export function useIsOverflow<T extends HTMLElement>(axis: 'x' | 'y') {
  const ref = useRef<T>(null);
  const [overflow, setOverflow] = useState(false);
  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const delta =
      axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    setOverflow(delta > 1);
  }, [axis]);

  useIsomorphicLayoutEffect(() => {
    check();
    // 字体加载完成会改变行宽/换行（FOUT swap），需重测；ready 已 resolve 时 then 立即执行
    document.fonts?.ready.then(check).catch(() => {});
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [check]);

  return { ref, overflow };
}
