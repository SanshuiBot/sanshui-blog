// @vitest-environment jsdom
/**
 * ReadingProgress（环形进度回顶）组件测试 —— 冻结/阈值/回顶/监听清理。
 * -----------------------------
 * 覆盖用户反馈 bug 的回归面（AGENTS.md #50/#51）：
 *  - 锁定期（body overflow=hidden，iOS fixed 锁把 scrollY 重置为 0）触发 scroll
 *    事件 → 进度与显隐必须冻结、不清零（组件内**同步** isBodyScrollLocked 判锁，
 *    无 effect-ref 竞态——review 修复项）
 *  - 400px 阈值边界（399 隐藏 / 401 显示）
 *  - 点击整圆 → window.scrollTo({ top: 0, behavior: 'smooth' })
 *  - unmount 移除 scroll 监听
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import ReadingProgress from '@/components/Post/ReadingProgress';

/* jsdom 缺失的 API 垫片：Tooltip 挂载时读 matchMedia('(hover: hover)') 判断 hover 能力 */
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

/** 桩 scrollY / scrollHeight（jsdom 无布局，需手动提供可滚上下文） */
function stubScroll(y: number, scrollHeight = 5000) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
}
function fireScroll() {
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}
const btn = () => document.querySelector<HTMLButtonElement>('button[aria-label="回到顶部"]');
const pctText = () => btn()?.querySelector('.font-mono')?.textContent ?? null;

describe('ReadingProgress', () => {
  afterEach(() => {
    cleanup();
    document.body.style.cssText = '';
    delete (window as { scrollY?: unknown }).scrollY;
    delete (document.documentElement as { scrollHeight?: unknown }).scrollHeight;
  });

  it('滚动 > 400px 显示，环内百分比随 scrollY 计算', () => {
    stubScroll(1500, 5000); // docHeight = 5000 - 768(jsdom innerHeight) = 4232 → 35%
    render(<ReadingProgress />);
    fireScroll();
    expect(btn()).toBeTruthy();
    expect(pctText()).toBe('35%');
  });

  it('400px 阈值边界：399 不显示 / 401 显示', () => {
    stubScroll(399, 5000);
    const { unmount } = render(<ReadingProgress />);
    fireScroll();
    expect(btn()).toBeNull();

    stubScroll(401, 5000);
    fireScroll();
    expect(btn()).toBeTruthy();
    unmount();
  });

  it('锁定期（iOS fixed 锁把 scrollY 重置为 0）冻结进度与显隐，不清零', () => {
    stubScroll(1500, 5000);
    render(<ReadingProgress />);
    fireScroll();
    expect(pctText()).toBe('35%');

    // 打开弹窗：useScrollLock 置 overflow=hidden，iOS 把 scrollY 重置为 0 并派发 scroll
    document.body.style.overflow = 'hidden';
    stubScroll(0, 5000); // docHeight 仍 > 0 的场景才是清空 bug 的暴露面
    fireScroll();
    expect(pctText()).toBe('35%'); // 冻结：未清空
    expect(btn()).toBeTruthy(); // 冻结：未隐藏

    // 关闭弹窗：解锁后随真实 scrollY 恢复重算
    document.body.style.overflow = '';
    stubScroll(2116, 5000); // 2116/4232 = 50%
    fireScroll();
    expect(pctText()).toBe('50%');
  });

  it('点击整圆调用平滑回顶', () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    stubScroll(1500, 5000);
    render(<ReadingProgress />);
    fireScroll();
    btn()?.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('unmount 移除 scroll 监听', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    stubScroll(1500, 5000);
    const { unmount } = render(<ReadingProgress />);
    fireScroll();
    expect(btn()).toBeTruthy();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    removeSpy.mockRestore();
  });
});
