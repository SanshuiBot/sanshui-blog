// @vitest-environment jsdom
/**
 * ThemeToggle 组件级测试 —— 亮/暗二态切换（无「跟随系统」档）。
 * -----------------------------
 * 覆盖行为契约：
 *  - light：显示「切换到暗色」，点击 setTheme('dark')。
 *  - dark：显示「切换到亮色」，点击 setTheme('light')。
 *  - 图标按当前主题渲染：dark 显示太阳（Sun 含 <circle>），light 显示月亮。
 * 依赖 mock：next-themes useTheme 返回可控状态；framer-motion 需 matchMedia 垫片。
 * 注意（约定 #46）：vitest 未开 globals，须手动 afterEach(cleanup)。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ThemeToggle from '@/components/UI/ThemeToggle';

const state = vi.hoisted(() => ({
  theme: 'light' as 'light' | 'dark',
  setTheme: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: state.theme,
    resolvedTheme: state.theme,
    setTheme: state.setTheme,
  }),
}));

/* ── jsdom 缺失的 API 垫片（framer-motion 需要）── */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
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
  state.setTheme.mockClear();
});

/** 取按钮内图标 svg 是否含 <circle>（Sun 含圆，Moon 不含）——区分当前图标 */
function iconIsSun(): boolean {
  const btn = screen.getByRole('button');
  return btn.querySelector('svg circle') !== null;
}

describe('ThemeToggle 二态切换', () => {
  it('light：显示「切换到暗色」，点击 setTheme("dark")', () => {
    state.theme = 'light';
    render(<ThemeToggle />);
    const btn = screen.getByRole('button', { name: '切换到暗色' });
    fireEvent.click(btn);
    expect(state.setTheme).toHaveBeenCalledWith('dark');
  });

  it('dark：显示「切换到亮色」，点击 setTheme("light")', () => {
    state.theme = 'dark';
    render(<ThemeToggle />);
    const btn = screen.getByRole('button', { name: '切换到亮色' });
    fireEvent.click(btn);
    expect(state.setTheme).toHaveBeenCalledWith('light');
  });

  it('dark 显示太阳图标（Sun 含圆）', () => {
    state.theme = 'dark';
    render(<ThemeToggle />);
    expect(iconIsSun()).toBe(true);
  });

  it('light 显示月亮图标（Moon 不含圆）', () => {
    state.theme = 'light';
    render(<ThemeToggle />);
    expect(iconIsSun()).toBe(false);
  });
});
