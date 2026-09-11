// @vitest-environment jsdom
/**
 * useIsBodyScrollLocked / isBodyScrollLocked 回归测试 —— 进度组件「冻结」的判锁基元。
 * -----------------------------
 * 修复依据：弹窗/抽屉打开关闭时顶部进度条与阅读百分比瞬间清空（用户反馈），
 * 根因是 iOS fixed 滚动锁把 window.scrollY 重置为 0。两个进度组件在锁定期
 * 冻结上次值，判锁统一走本基元：useScrollLock（全站唯一锁实现）锁定时必置
 * document.body.style.overflow='hidden'。回归此契约即可拦住「判锁被改坏」的重犯。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { isBodyScrollLocked, useIsBodyScrollLocked } from '@/components/UI/useIsBodyScrollLocked';

describe('useIsBodyScrollLocked', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.body.style.cssText = '';
  });

  it('SSR 安全：无 document（服务端预渲染）时返回 false 不抛错', () => {
    vi.stubGlobal('document', undefined);
    expect(isBodyScrollLocked()).toBe(false);
  });

  it('判锁基元：body overflow=hidden（useScrollLock 的锁定写法）即视为锁定', () => {
    expect(isBodyScrollLocked()).toBe(false);
    document.body.style.overflow = 'hidden';
    expect(isBodyScrollLocked()).toBe(true);
  });

  it('hook 经 MutationObserver 响应锁状态变化（弹层开合同步）', async () => {
    const { result } = renderHook(() => useIsBodyScrollLocked());
    expect(result.current).toBe(false);

    await act(async () => {
      document.body.style.overflow = 'hidden';
    });
    expect(result.current).toBe(true);

    await act(async () => {
      document.body.style.overflow = '';
    });
    expect(result.current).toBe(false);
  });
});
