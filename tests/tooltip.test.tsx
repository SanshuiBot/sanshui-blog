// @vitest-environment jsdom
/**
 * Tooltip 组件级测试 —— hover 显示契约 + 焦点还原粘滞回归。
 * -----------------------------
 * 回归背景：SearchModal ESC 关闭后 useFocusTrap 把焦点还给搜索按钮，
 * onFocus 触发了 handleEnter，气泡在鼠标不在按钮上的情况下显示且
 * 永不消失（没有 mouseleave 来清除）。契约：气泡只跟鼠标 hover 显示。
 * 注意：
 *  - RTL 的自动 cleanup 依赖全局 afterEach（vitest 默认未开 globals），须手动
 *    afterEach(cleanup)。
 *  - React 的 onMouseEnter/onMouseLeave 由原生 mouseover/mouseout 合成
 *    （enter/leave 不冒泡），fireEvent 用 mouseOver/mouseOut 触发；
 *    onFocus 由原生 focusin 合成，用 fireEvent.focusIn 触发。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import Tooltip from '@/components/UI/Tooltip';

/* ── jsdom 缺失的 API 垫片：桌面 hover 能力 ── */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Tooltip', () => {
  it('鼠标悬停显示气泡，移开后 60ms 内隐藏', () => {
    vi.useFakeTimers();
    render(
      <Tooltip label="搜索">
        <button aria-label="搜索">🔍</button>
      </Tooltip>,
    );

    fireEvent.mouseOver(screen.getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.mouseOut(screen.getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('回归：仅 focus 无 hover 不显示气泡（弹窗 ESC 关闭焦点还原不再粘滞）', () => {
    vi.useFakeTimers();
    render(
      <Tooltip label="搜索">
        <button aria-label="搜索">🔍</button>
      </Tooltip>,
    );

    // 模拟 SearchModal 关闭后 useFocusTrap 把焦点还给搜索按钮：
    // 只触发 focus，不触发任何 mouse 事件（鼠标不在按钮上）
    fireEvent.focusIn(screen.getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('回归：窗口失焦（alt+tab 切走）立即隐藏气泡，不再粘滞', () => {
    vi.useFakeTimers();
    render(
      <Tooltip label="搜索">
        <button aria-label="搜索">🔍</button>
      </Tooltip>,
    );

    // hover 显示气泡
    fireEvent.mouseOver(screen.getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeTruthy();

    // alt+tab 切走：窗口失焦，浏览器收不到 mouseleave，气泡必须立即隐藏
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('回归：窗口切走再切回、指针仍在按钮上时恢复气泡', () => {
    vi.useFakeTimers();
    render(
      <Tooltip label="搜索">
        <button aria-label="搜索">🔍</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button');

    // 记录指针位置（handleMove 即使气泡未显示也持续更新）
    fireEvent.mouseMove(button, { clientX: 100, clientY: 100 });
    // jsdom 未实现 elementFromPoint，stub 成「指针位置命中按钮」
    const prev = document.elementFromPoint;
    Object.defineProperty(document, 'elementFromPoint', {
      writable: true,
      configurable: true,
      value: () => button,
    });
    try {
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });
      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(screen.getByRole('tooltip')).toBeTruthy();
    } finally {
      if (typeof prev === 'function') {
        document.elementFromPoint = prev;
      } else {
        delete (document as { elementFromPoint?: unknown }).elementFromPoint;
      }
    }
  });
});
