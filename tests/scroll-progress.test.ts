import { describe, expect, it } from 'vitest';
import { calcScrollProgress } from '@/lib/scroll-progress';

/**
 * 顶部进度条进度计算契约：
 *  - 分母（可滚高度）≤ 0 时必须返回 0，不允许 Infinity/NaN——
 *    回归锁定：iOS 弹窗 fixed 滚动锁会让 scrollHeight 塌缩到一屏高，
 *    旧实现直接除导致「进度条瞬间填满」（历史 bug）
 *  - 正常区间 [0,1]，双向钳制
 */
describe('calcScrollProgress', () => {
  it('文档不足一屏（maxScroll ≤ 0）返回 0，不产生 Infinity/NaN', () => {
    expect(calcScrollProgress(0, 800, 800)).toBe(0);
    expect(calcScrollProgress(500, 800, 800)).toBe(0);
    expect(calcScrollProgress(500, 600, 800)).toBe(0);
  });

  it('中途值按比例返回（0.5）', () => {
    // scrollY=1000, maxScroll=10000-800=9200 → ≈0.1087
    expect(calcScrollProgress(1000, 10000, 800)).toBeCloseTo(1000 / 9200, 10);
    expect(calcScrollProgress(4600, 10000, 800)).toBeCloseTo(0.5, 10);
  });

  it('越界双向钳制到 [0,1]', () => {
    expect(calcScrollProgress(-100, 10000, 800)).toBe(0);
    expect(calcScrollProgress(99999, 10000, 800)).toBe(1);
  });

  it('fixed 滚动锁塌缩场景：scrollY 归零 + scrollHeight 塌缩 → 0（回归历史 bug）', () => {
    // 塌缩瞬间 scrollY 可能仍读到旧值（事件时序），无论哪种组合都必须是 0
    expect(calcScrollProgress(2000, 800, 800)).toBe(0);
    expect(calcScrollProgress(2000, 100, 800)).toBe(0);
  });
});
