// @vitest-environment jsdom
/**
 * Tooltip 组件级测试 —— hover 显示契约。
 * -----------------------------
 * 契约：气泡只在鼠标 hover 时显示（mouseenter 后 80ms 显示 / mouseleave 后
 * 60ms 隐藏），除此之外不做任何显示（如 focus 显示——弹窗关闭后焦点还原
 * 会让气泡在无鼠标坐标的情况下粘滞，回归见下）。
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
});
