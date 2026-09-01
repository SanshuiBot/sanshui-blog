// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useScrollThumbGeometry } from '@/components/UI/useScrollThumbGeometry';

/**
 * 契约层测试：hook 把 clientHeight/scrollHeight/scrollTop 正确喂给 thumbGeometry，
 * rAF 防抖在 effect cleanup 时被清，fonts.ready 仅冷启动兜底一次。
 * 纯函数 thumbGeometry 的不变量测试见 tests/thumbGeometry.test.ts，此处不重复。
 */

// ----- 测试桩 -----

/** 受控 ResizeObserver：测试里手动触发 .callback(entries) 模拟尺寸变化 */
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  constructor(public callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  static reset() {
    MockResizeObserver.instances = [];
  }
}

/** 受控 rAF：同步队列，测试可手动 flush */
const rafQueue: Array<() => void> = [];
const mockRaf = vi.fn((cb: () => void) => {
  rafQueue.push(cb);
  return rafQueue.length; // 返回 ID（1-based）
});
const mockCancelRaf = vi.fn((id: number) => {
  // 简单清理：把对应 index 置空
  if (id >= 1 && id <= rafQueue.length) rafQueue[id - 1] = null as unknown as () => void;
});
const flushRaf = () => {
  while (rafQueue.length > 0) {
    const cb = rafQueue.shift();
    cb?.();
  }
};

/**
 * 受控 element：clientHeight/scrollHeight/scrollTop 可注入，addEventListener
 * 委托给内部 Map（unmount 时 removeEventListener 才不会报错）。
 */
function makeElement(overrides: Partial<HTMLElement> = {}): HTMLElement {
  const handlers = new Map<string, EventListener>();
  const el = {
    clientHeight: 400,
    scrollHeight: 1000,
    scrollTop: 0,
    firstElementChild: null,
    addEventListener: (type: string, listener: EventListener) => {
      handlers.set(type, listener);
    },
    removeEventListener: (type: string) => {
      handlers.delete(type);
    },
    trigger: (type: string) => {
      handlers.get(type)?.({} as Event);
    },
  } as unknown as HTMLElement;
  return Object.assign(el, overrides);
}

beforeEach(() => {
  MockResizeObserver.reset();
  rafQueue.length = 0;
  mockRaf.mockClear();
  mockCancelRaf.mockClear();
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  vi.stubGlobal('requestAnimationFrame', mockRaf);
  vi.stubGlobal('cancelAnimationFrame', mockCancelRaf);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ----- 契约测试 -----

describe('useScrollThumbGeometry', () => {
  it('挂载即排队一次 rAF 计算（首帧延一帧算准布局）', async () => {
    const el = makeElement();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLElement>(null);
      // 把 el 直接挂到 ref.current 上（renderHook 不渲染真实 DOM）
      (ref as unknown as { current: HTMLElement }).current = el;
      return useScrollThumbGeometry(ref);
    });

    // 排了一次 rAF
    expect(mockRaf).toHaveBeenCalledTimes(1);

    // flush rAF → thumb 被算出
    flushRaf();
    await waitFor(() => {
      expect(result.current.thumb).toEqual({ top: 0, height: 160 });
    });
  });

  it('ResizeObserver 触发时再排一次 rAF（防抖合并到下一帧）', () => {
    const el = makeElement();
    renderHook(() => {
      const ref = useRef<HTMLElement>(null);
      (ref as unknown as { current: HTMLElement }).current = el;
      return useScrollThumbGeometry(ref);
    });

    // 首帧已排一次
    expect(mockRaf).toHaveBeenCalledTimes(1);

    // 模拟尺寸变化：用首个 MockResizeObserver 实例的 callback 手动触发
    const inst = MockResizeObserver.instances[0]!;
    inst.callback([], inst);

    // 排了第二次 rAF
    expect(mockRaf).toHaveBeenCalledTimes(2);
  });

  it('unmount 时 cancelAnimationFrame 被调用（清遗留 rAF）', () => {
    const el = makeElement();
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(null);
      (ref as unknown as { current: HTMLElement }).current = el;
      return useScrollThumbGeometry(ref);
    });

    // 首帧 rAF 还没 flush，unmount 应清掉它
    expect(mockCancelRaf).toHaveBeenCalledTimes(0);
    unmount();
    expect(mockCancelRaf).toHaveBeenCalledTimes(1);
  });

  it('hook 把对的尺寸喂给 thumbGeometry（契约：读 clientHeight/scrollHeight/scrollTop）', async () => {
    const el = makeElement({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 150,
    });
    const { result } = renderHook(() => {
      const ref = useRef<HTMLElement>(null);
      (ref as unknown as { current: HTMLElement }).current = el;
      return useScrollThumbGeometry(ref);
    });

    flushRaf();
    // thumbGeometry(200, 600, 150) → height ≈ 66.67, top ≈ 50
    // 用 toEqual 精确匹配纯函数输出，验证 hook 透传了正确尺寸
    await waitFor(() => {
      expect(result.current.thumb).toEqual({
        top: expect.any(Number),
        height: expect.any(Number),
      });
    });
    // 具体值与 thumbGeometry(200, 600, 150) 一致
    expect(result.current.thumb!.height).toBeCloseTo(200 / 3, 5);
    expect(result.current.thumb!.top).toBeCloseTo(50, 5);
  });

  it('container 为 null 时 hook 安全无操作', () => {
    // renderHook 里 ref.current 永远是 null
    const { result } = renderHook(() => {
      const ref = useRef<HTMLElement>(null);
      return useScrollThumbGeometry(ref);
    });

    expect(mockRaf).not.toHaveBeenCalled();
    expect(result.current.thumb).toBeNull();
  });
});
