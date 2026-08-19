'use client';
import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 模态/抽屉焦点陷阱 —— Tab 循环 + 关闭后焦点还原。
 * -----------------------------
 * 之前 SearchModal 与移动端抽屉都没有 trap：Tab 会把焦点逃出模态
 * 到背景页面，键盘用户丢失上下文。本 hook 收口统一仪式：
 *  - 激活时记录当前焦点（document.activeElement），关闭时还原
 *  - Tab / Shift+Tab 在容器内可聚焦元素间循环（含「焦点逃出后再按 Tab」兜底）
 *  - 初始焦点不抢：SearchModal 有自己的延迟聚焦逻辑（input），
 *    抽屉/其他场景由调用方自行决定是否聚焦首个元素
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] => {
      if (!ref.current) return [];
      return Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = getFocusable();
      if (els.length === 0) return;
      const first = els[0]!;
      const last = els[els.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      const inside = ref.current?.contains(active) ?? false;
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // 关闭后把焦点还给打开模态的那个元素（键盘/读屏用户不丢位置）
      prevFocusRef.current?.focus();
    };
  }, [ref, active]);
}
