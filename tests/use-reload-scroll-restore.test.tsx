// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import { useReloadScrollRestore } from '@/components/Home/useReloadScrollRestore';

/**
 * 首页刷新滚动还原 hook 契约测试。
 * -----------------------------
 * 锁定历史 bug 回归：首页内容全部异步渲染（dynamic ssr:false），刷新时
 * 原生滚动恢复被 clamp 到顶部且无补恢复机制。本 hook 在 pagehide 时保存
 * 位置，挂载后等文档高度足够时 scrollTo 还原。
 */

const KEY = 'sansui-home-scroll-restore';

/** 受控 rAF：测试手动 flush，避免真实异步时序 */
const rafQueue: Array<() => void> = [];
const mockRaf = vi.fn((cb: () => void) => {
  rafQueue.push(cb);
  return rafQueue.length;
});
const mockCancelRaf = vi.fn((id: number) => {
  if (id >= 1 && id <= rafQueue.length) rafQueue[id - 1] = null as unknown as () => void;
});
/** 单步执行一个待跑的 rAF 回调：hook 的轮询会自续 cycle，不能循环 flush */
const stepRaf = () => {
  const cb = rafQueue.shift();
  cb?.();
};

function stubScrollGeometry(y: number, scrollHeight: number, innerHeight: number) {
  const desc = Object.getOwnPropertyDescriptor(window, 'scrollY');
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
  return () => {
    if (desc) Object.defineProperty(window, 'scrollY', desc);
    else delete (window as unknown as Record<string, unknown>).scrollY;
  };
}

describe('useReloadScrollRestore', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>;
  let restoreY: () => void;

  beforeEach(() => {
    rafQueue.length = 0;
    vi.stubGlobal('requestAnimationFrame', mockRaf);
    vi.stubGlobal('cancelAnimationFrame', mockCancelRaf);
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    sessionStorage.clear();
    document.body.style.overflow = '';
    // jsdom 默认 scrollY=0 / scrollHeight=0；测试内按需覆写
    restoreY = stubScrollGeometry(0, 10000, 800);
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    restoreY();
    cleanup();
  });

  it('pagehide 时保存当前位置到 sessionStorage', () => {
    restoreY = stubScrollGeometry(2000, 10000, 800);
    renderHook(() => useReloadScrollRestore());

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    expect(saved).toEqual({ path: window.location.pathname, y: 2000 });
  });

  it('挂载时发现已保存位置且高度足够：立即 scrollTo 还原', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ path: window.location.pathname, y: 2000 }));
    // 挂载时（scrollY=0）文档已足够高：maxScroll = 10000-800 = 9200 ≥ 2000
    restoreY = stubScrollGeometry(0, 10000, 800);

    renderHook(() => useReloadScrollRestore());
    stepRaf();

    expect(scrollToSpy).toHaveBeenCalledWith(0, 2000);
  });

  it('高度不够时轮询等待，撑开后才还原（异步内容场景）', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ path: window.location.pathname, y: 2000 }));
    // 初始文档只有一屏高：maxScroll = 900-800 = 100 < 2000
    restoreY = stubScrollGeometry(0, 900, 800);

    renderHook(() => useReloadScrollRestore());
    stepRaf();
    // 高度还不够：第一次 tick 只能继续轮询
    expect(scrollToSpy).not.toHaveBeenCalled();

    // 内容异步撑开文档：下一次 tick 还原
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 10000,
      configurable: true,
    });
    stepRaf();
    expect(scrollToSpy).toHaveBeenCalledWith(0, 2000);
  });

  it('保存位置超出当前最大可滚（内容变少）：超时后 clamp 还原，不越界', () => {
    // 只 fake Date（hook 用 Date.now 判超时）；默认会连 rAF 一起 fake，
    // 把我们 stub 的 rAF 覆盖掉，轮询回调就永远进不了队列
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ path: window.location.pathname, y: 2000 }));
      // 高度始终不足：maxScroll = 1000-800 = 200
      restoreY = stubScrollGeometry(0, 1000, 800);

      renderHook(() => useReloadScrollRestore());
      // 推进超过 RESTORE_TIMEOUT_MS(2000) 后触发超时分支（Date.now 真实时间，
      // fake timers 不影响——直接用 vi.setSystemTime 推进）
      vi.setSystemTime(Date.now() + 3000);
      stepRaf();

      expect(scrollToSpy).toHaveBeenCalledWith(0, 200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('SPA 卸载时清 key：过期位置不带入下次挂载', () => {
    restoreY = stubScrollGeometry(2000, 10000, 800);
    const { unmount } = renderHook(() => useReloadScrollRestore());
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(sessionStorage.getItem(KEY)).not.toBeNull();

    unmount();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('无保存位置（首次进入/在顶部刷新）：零副作用', () => {
    renderHook(() => useReloadScrollRestore());
    stepRaf();
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(rafQueue.length).toBe(0);
  });

  it('保存的 path 不匹配（跨页面残留）：不还原', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ path: '/other/', y: 2000 }));
    restoreY = stubScrollGeometry(0, 10000, 800);

    renderHook(() => useReloadScrollRestore());
    stepRaf();
    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
