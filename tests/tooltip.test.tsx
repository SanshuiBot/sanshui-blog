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

// 窄屏用例会覆盖视口尺寸，记录原值以便 afterEach 还原
const originalInnerWidth = window.innerWidth;
const originalInnerHeight = window.innerHeight;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalInnerWidth,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: originalInnerHeight,
  });
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

  it('回归：小屏（375px）右边缘 hover 且鼠标停住不动，气泡钳制在视口内', () => {
    vi.useFakeTimers();
    // 覆盖 jsdom 默认 1024×768 视口为窄屏（afterEach 还原）
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
    render(
      <Tooltip label="切换到暗色">
        <button aria-label="暗色">🌙</button>
      </Tooltip>,
    );

    // 鼠标贴着右边缘进入后停住：mousemove 发生在显示定时器（80ms）触发前，
    // 旧实现此时不评估翻转 → 气泡按「鼠标右侧」定位（374px + 气泡宽）直接出屏；
    // 新实现渲染期从 state 推导翻转 + 8px 钳制，气泡左缘必落在视口内。
    fireEvent.mouseOver(screen.getByRole('button'), { clientX: 360, clientY: 300 });
    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 360, clientY: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const tooltip = screen.getByRole('tooltip');
    const left = Number.parseFloat(tooltip.style.left);
    expect(left).toBeGreaterThanOrEqual(8);
    // 气泡左缘 + 气泡宽（jsdom 无布局，offsetWidth 为 0，此处验证左缘钳制）
    expect(left).toBeLessThanOrEqual(375 - 8);

    // jsdom 没有布局引擎，offsetWidth/offsetHeight 恒为 0，上面的断言只证明
    // 「有钳制」。下面 mock 一个真实气泡宽（80×28）再移动鼠标，用精确值锁定
    // 翻转判断与钳制里的 - bubbleSize.w 边界数学（code review 建议）。
    Object.defineProperty(tooltip, 'offsetWidth', {
      writable: true,
      configurable: true,
      value: 80,
    });
    Object.defineProperty(tooltip, 'offsetHeight', {
      writable: true,
      configurable: true,
      value: 28,
    });
    // 右边缘（x=355）：355+14+80=449 > 375-8 → 翻转，左缘 = 355-14-80 = 261
    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 355, clientY: 300 });
    expect(Number.parseFloat(tooltip.style.left)).toBe(261);
    // 移出翻转区间（x=200）：200+14+80=294 ≤ 367 → 不翻转，左缘 = 200+14 = 214
    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 200, clientY: 300 });
    expect(Number.parseFloat(tooltip.style.left)).toBe(214);
    // 下边缘（y=650）：650+14+28=692 > 667-8 → 翻转，top = 650-14-28 = 608
    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 200, clientY: 650 });
    expect(Number.parseFloat(tooltip.style.top)).toBe(608);
    // 移出翻转区间（y=300）：300+14+28=342 ≤ 659 → 不翻转，top = 300+14 = 314
    fireEvent.mouseMove(screen.getByRole('button'), { clientX: 200, clientY: 300 });
    expect(Number.parseFloat(tooltip.style.top)).toBe(314);
  });
});
