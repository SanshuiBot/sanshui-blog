import { describe, expect, it } from 'vitest';
import { EXIT_STAGGER } from '@/components/Home/HeroParallax';

/**
 * 首屏退场契约（hero-parallax-exit）：
 * 「滚动淡出首屏内容」是功能性行为（AGENTS.md #43，reduced-motion 下也保留），
 * 历史 bug 根因是内容永不消失。EXIT_STAGGER 定义了各组退场 opacity 窗口
 * （vh 倍率），本测试锁定其不变式，防止回归：
 *  1. 每个窗口终点 ≤1vh —— 滚动一屏后首屏内容必然全部隐藏；
 *  2. 窗口起点依次后移 —— 错峰节奏成立；
 *  3. badge 最先退场、CTA 最后消失 —— 行动点留最久。
 */
describe('EXIT_STAGGER 首屏退场契约', () => {
  it('每个组的 opacity 窗口终点都不超过 1vh（滚动一屏后首屏必然全部隐藏）', () => {
    const windows = Object.values(EXIT_STAGGER);
    expect(windows.length).toBe(5);
    for (const [start, end] of windows) {
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeGreaterThan(start);
      expect(end).toBeLessThanOrEqual(1);
    }
  });

  it('窗口起点依次后移，形成逐层退场的错峰节奏', () => {
    const starts = Object.values(EXIT_STAGGER).map(([start]) => start);
    const sorted = [...starts].sort((a, b) => a - b);
    expect(starts).toEqual(sorted);
    // 起点严格递增（无重叠起点）
    expect(new Set(starts).size).toBe(starts.length);
  });

  it('badge 最先退场、CTA 最后消失（行动点留最久）', () => {
    const ends = Object.values(EXIT_STAGGER).map(([, end]) => end);
    expect(EXIT_STAGGER.badge[1]).toBe(Math.min(...ends));
    expect(EXIT_STAGGER.cta[1]).toBe(Math.max(...ends));
  });
});
