// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSafeTimeout } from '@/components/UI/useSafeTimeout';

/**
 * 契约测试三条（ADR-0003）：
 *  (1) set(fn, delay) 调 setTimeout(fn, delay)
 *  (2) 返回的 cancel() 调 clearTimeout
 *  (3) unmount 时未触发的 timer 被 clearTimeout（核心「卸载后 setState」bug 类修法）
 *
 * useSafeTimeout 只覆盖「ref + cleanup」模式（Tooltip / NavigationLoading /
 * ResumeTerminal）；"inline const" 模式（SearchModal / CodeCopyInjector / useDismiss）
 * 已经安全，不在 scope。
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
const mockSet = vi.fn((_cb: () => void, _delay: number) => 1);
const mockClear = vi.fn(() => {});
/* eslint-enable @typescript-eslint/no-unused-vars */

beforeEach(() => {
  mockSet.mockClear();
  mockClear.mockClear();
  vi.stubGlobal('setTimeout', mockSet);
  vi.stubGlobal('clearTimeout', mockClear);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useSafeTimeout', () => {
  it('set(fn, delay) 调 setTimeout(fn, delay)', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useSafeTimeout());
    result.current(fn, 300);

    expect(mockSet).toHaveBeenCalledTimes(1);
    const [actualFn, actualDelay] = mockSet.mock.calls[0]!;
    expect(actualDelay).toBe(300);
    // setTimeout 内 cb 由 hook 包了一层（清 ID 再调原 fn），不便字面比对；
    // 触发 timer 验证原 fn 被调
    actualFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('set 返回的 cancel() 调 clearTimeout（途中取消未触发 timer）', () => {
    const { result } = renderHook(() => useSafeTimeout());
    const cancel = result.current(() => {}, 500);

    expect(mockClear).not.toHaveBeenCalled();
    cancel();
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it('unmount 时未触发的 timer 被 clearTimeout（核心 bug 类修法）', () => {
    const { result, unmount } = renderHook(() => useSafeTimeout());
    result.current(() => {}, 1000); // 未触发

    expect(mockClear).not.toHaveBeenCalled();
    unmount();
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it('set 重排会先清上一个未触发 timer（replaceable 语义靠 hook 内置清旧）', async () => {
    const { result } = renderHook(() => useSafeTimeout());
    result.current(() => {}, 300);
    expect(mockClear).not.toHaveBeenCalled();

    // 第二次 set：hook 内部先清上一个未触发 timer
    result.current(() => {}, 500);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });
});
