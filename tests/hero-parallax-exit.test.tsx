// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as HeroModule from '@/components/Home/HeroParallax';
import HeroParallax, { EXIT_FADE } from '@/components/Home/HeroParallax';

/**
 * 首屏退场契约（hero-parallax-exit）：
 * 「滚动后首屏消失」（AGENTS.md #43）由**物理滚动**满足——前景层在文档流内，
 * 被后续内容顶出视口；不再存在旧 EXIT_STAGGER 式的长窗口逐层淡出（慢滚鬼影）。
 * 仅保留 EXIT_FADE 润色：0.2→0.85vh 区段淡出 + 轻微收缩（内容随滚动移动，无原地鬼影）。
 * 本测试锁定不变式，防止回归：
 *  1. 前景层必须在文档流内（relative），不能回到 fixed 原地淡出；
 *  2. 模块不再导出 EXIT_STAGGER——旧退场映射代码被删除而非注释；
 *  3. EXIT_FADE 起点覆盖中段（≤0.25 且 >0）——太晚则润色不可见，从 0 起则内容「站不住」；
 *  4. EXIT_FADE 终点 ≤0.85vh，完全隐藏发生在明显离屏之前；
 *  5. EXIT_FADE 收缩量轻微（scale>0.9），是「收势」不是缩小消失。
 */

vi.mock('@/lib/posts-index-cache', () => ({
  getPostsIndex: () => Promise.resolve([]),
}));

/* jsdom 缺失的 API 垫片（framer-motion 需要） */
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

afterEach(cleanup);

describe('首屏退场契约（物理滚出）', () => {
  it('前景层在文档流内（relative z-10），不是 fixed——退场由物理滚动完成', () => {
    const { container } = render(
      <HeroParallax stats={{ posts: 1, tags: 1, lastUpdated: '2026-01-01' }} />,
    );
    // 直接按结构定位前景层，不依赖内部文案——若未来把标题包进更深的嵌套 section，
    // 本断言仍能锁定真实前景 <section>（背景层是 <div className="fixed ...">，无 section）
    const foreground = Array.from(container.querySelectorAll('section')).find(
      (el) => el.classList.contains('relative') && el.classList.contains('z-10'),
    );
    expect(foreground).not.toBeNull();
    expect(foreground!.className).toContain('relative');
    expect(foreground!.className).toContain('z-10');
    expect(foreground!.className).not.toContain('fixed');
  });

  it('模块不再导出 EXIT_STAGGER（JS 退场映射已删除，防止回归）', () => {
    expect('EXIT_STAGGER' in HeroModule).toBe(false);
  });
});

describe('EXIT_FADE 退场润色契约', () => {
  it('窗口覆盖中段滚动区段：淡出肉眼全程可见（内容随滚动移动，无原地鬼影）', () => {
    // 起点要足够早——太晚（如旧 0.65）时内容大半已滚出视口，润色形同虚设
    expect(EXIT_FADE.start).toBeLessThanOrEqual(0.25);
    // 但不能从 0 开始——刚滚动就淡出会显得内容「站不住」
    expect(EXIT_FADE.start).toBeGreaterThan(0);
  });

  it('终点 ≤0.85vh：完全隐藏发生在明显离屏之前（配合物理滚动无残影）', () => {
    expect(EXIT_FADE.end).toBeLessThanOrEqual(0.85);
    expect(EXIT_FADE.end).toBeGreaterThan(EXIT_FADE.start);
  });

  it('收缩量轻微（scale > 0.9）：是「收势」不是缩小消失', () => {
    expect(EXIT_FADE.scale).toBeGreaterThan(0.9);
    expect(EXIT_FADE.scale).toBeLessThan(1);
  });
});
