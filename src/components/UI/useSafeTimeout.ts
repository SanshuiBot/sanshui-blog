'use client';
import { useCallback, useEffect, useRef } from 'react';

/**
 * 卸载安全的 setTimeout —— 统一「ref + cleanup」仪式，修「卸载后 setState」bug 类。
 *
 * 之前 Tooltip / NavigationLoading / ResumeTerminal 各自手写 useRef<ReturnType<typeof
 * setTimeout>> + effect cleanup clearTimeout + null-guard，最近一次提交 e6735f8
 * 修的 ResumeTerminal 泄漏就是这个 bug 类。详见 ADR-0003。
 *
 * 接口（窄口径）：
 *  - `set(fn, delay)` → 排一次 timer，返回 `cancel()` 中途可调
 *  - hook 内 useRef 持 ID，effect cleanup 自动 clearTimeout（unmount 安全）
 *
 * **不内置「调用前清旧」**——双向 debounce（Tooltip show/hide）与 replaceable
 * timeout（NavigationLoading 重置 show timer）语义不同，调用方需要 replaceable
 * 时先调返回的 cancel() 再 set。强行内置会让接口比两个独立 cancel 还复杂
 * （删「清旧」复杂度只是被推回调用方，不是真缝）。
 *
 * **不覆盖 "inline const" 模式**——SearchModal / CodeCopyInjector / useDismiss 在
 * effect 内 `const t = setTimeout` + cleanup `clearTimeout(t)` 已经安全（闭包绑死 t），
 * 换 hook 反而多一层间接。
 *
 * @returns `set(fn, delay) => cancel` —— cancel 调未触发的 timer 会被 clearTimeout
 */
export function useSafeTimeout(): (fn: () => void, delay: number) => () => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // fn 用 ref 持有，仿 useDismiss 模式：避免内联箭头每次渲染重挂 effect
  const fnRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const set = useCallback(
    (fn: () => void, delay: number): (() => void) => {
      // 清上一个未触发的 timer（如有），避免重叠
      cancel();
      fnRef.current = fn;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current?.();
      }, delay);
      return cancel;
    },
    [cancel],
  );

  // unmount 时清遗留 timer——核心 bug 类的修法
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return set;
}
