// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useScrollLock } from '@/components/UI/useScrollLock';

/**
 * useScrollLock 契约测试。
 * -----------------------------
 * 锁定历史 bug 回归：iOS fixed 方案必须在设置 position:fixed **之前**
 * 捕获 window.scrollY（fixed 生效后 scrollY 立即归零，再读只能拿到 0，
 * 负 top 失效 → 弹窗打开页面跳顶、关闭还原不回去）。
 * 另锁定设备判定收窄：fixed 方案仅 iOS 启用，Android / 桌面走纯 overflow:hidden。
 */

function stubNavigator(overrides: { userAgent?: string; maxTouchPoints?: number }) {
  const nav = window.navigator as unknown as Record<string, unknown>;
  const originals: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(overrides)) {
    originals[k] = Object.getOwnPropertyDescriptor(nav, k);
    Object.defineProperty(nav, k, { value: v, configurable: true });
  }
  return () => {
    for (const [k, desc] of Object.entries(originals)) {
      if (desc) Object.defineProperty(nav, k, desc);
      else delete nav[k];
    }
  };
}

function stubScrollY(y: number): () => void {
  const desc = Object.getOwnPropertyDescriptor(window, 'scrollY');
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  return () => {
    if (desc) Object.defineProperty(window, 'scrollY', desc);
    else delete (window as unknown as Record<string, unknown>).scrollY;
  };
}

describe('useScrollLock', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // jsdom 未实现 scrollTo（会打 "Not implemented"），spy 掉并断言调用
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
    cleanup();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  it('桌面设备：只锁 overflow，不碰 position/top，还原时恢复原值', () => {
    const restoreNav = stubNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
      maxTouchPoints: 0,
    });
    document.body.style.overflow = 'auto';

    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('');

    unmount();
    expect(document.body.style.overflow).toBe('auto');
    expect(scrollToSpy).not.toHaveBeenCalled();
    restoreNav();
  });

  it('Android 触屏：overflow:hidden 即可，不启用 fixed 方案', () => {
    const restoreNav = stubNavigator({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
      maxTouchPoints: 5,
    });

    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('');

    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(scrollToSpy).not.toHaveBeenCalled();
    restoreNav();
  });

  it('iOS：fixed 方案在 fixed 之前捕获 scrollY（负 top 保存真实位置，回归核心 bug）', () => {
    const restoreNav = stubNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      maxTouchPoints: 5,
    });
    // scrollY=2000（页面底部）；旧实现先设 fixed（scrollY 归零）再读 → top 变 "-0px"
    const restoreY = stubScrollY(2000);

    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-2000px');
    expect(document.body.style.width).toBe('100%');

    unmount();
    // 关闭还原：scrollTo 回捕获的位置 + 样式清空
    expect(scrollToSpy).toHaveBeenCalledWith(0, 2000);
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.overflow).toBe('');
    restoreNav();
    restoreY();
  });

  it('iPadOS 13+（Macintosh UA + 多点触摸）：识别为 iOS，走 fixed 方案', () => {
    const restoreNav = stubNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
    });
    const restoreY = stubScrollY(300);

    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-300px');

    unmount();
    expect(scrollToSpy).toHaveBeenCalledWith(0, 300);
    restoreNav();
    restoreY();
  });

  it('inactive 时不设置任何锁定', () => {
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
