// @vitest-environment jsdom
/**
 * useScrollLock 滚动锁回归测试 —— iOS fixed 锁 + 解锁恢复绕过 CSS smooth。
 * -----------------------------
 * 历史 bug：移动端关闭搜索弹窗/菜单抽屉时页面自行滑动一段（停回原位）。
 * 根因：iOS 路径解锁用 window.scrollTo(0, savedY) 还原滚动，而全站
 * `html { scroll-behavior: smooth }` 会让 WebKit 把这次程序化滚动动画化。
 * 修复：还原期间把根元素 scroll-behavior 临时覆盖为 auto（inline 优先于
 * stylesheet），scrollTo 后还原。
 * 承重契约：scrollTo 被调用时 documentElement.style.scrollBehavior === 'auto'，
 * 且调用后还原为空。回归此断言即可拦住「改回裸 scrollTo」的重犯。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useScrollLock } from '@/components/UI/useScrollLock';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

function mockUA(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
}

describe('useScrollLock', () => {
  afterEach(() => {
    cleanup();
    // 还原各 mock 与样式，避免跨用例污染（vitest 未开 globals，RTL 不自动 cleanup）
    delete (window.navigator as { userAgent?: string }).userAgent;
    delete (window as { scrollY?: unknown }).scrollY;
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
  });

  it('iOS：锁定用 fixed + 负 top 保持视觉位置；解锁还原滚动必须绕过 CSS smooth', () => {
    mockUA(IPHONE_UA);
    const scrollBehaviorAtCall: string[] = [];
    window.scrollTo = ((x: number, y: number) => {
      scrollBehaviorAtCall.push(document.documentElement.style.scrollBehavior);
      expect(x).toBe(0);
      expect(y).toBe(900);
    }) as typeof window.scrollTo;
    // jsdom 无布局，scrollY 恒 0 —— 直接桩出「页面已滚到 900px」的捕获值
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });

    const { rerender } = renderHook(({ active }: { active: boolean }) => useScrollLock(active), {
      initialProps: { active: false },
    });

    act(() => rerender({ active: true }));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-900px');

    act(() => rerender({ active: false }));
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    // 承重契约：还原发生在 scroll-behavior:auto 覆盖下（WebKit 上才不会动画滑动），
    // 且调用后覆盖已还原
    expect(scrollBehaviorAtCall).toEqual(['auto']);
    expect(document.documentElement.style.scrollBehavior).toBe('');
  });

  it('Android：纯 overflow 锁，解锁不调用 scrollTo（无还原动画风险）', () => {
    mockUA(ANDROID_UA);
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;

    const { rerender } = renderHook(({ active }: { active: boolean }) => useScrollLock(active), {
      initialProps: { active: false },
    });

    act(() => rerender({ active: true }));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('');

    act(() => rerender({ active: false }));
    expect(document.body.style.overflow).toBe('');
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
