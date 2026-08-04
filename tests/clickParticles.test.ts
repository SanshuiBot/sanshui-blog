import { describe, it, expect } from 'vitest';
import {
  easeOutCubic,
  easeOutQuad,
  easeInQuad,
  makeHeartStyle,
  makeExplosionStyle,
  makeRocketStyle,
  makeBurstStyle,
  makeRippleStyle,
  makeStarStyle,
  makeSakuraStyle,
} from '@/lib/clickParticles';

describe('easing 曲线', () => {
  it('easeOutCubic: 起点 0 终点 1 且递增', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('easeOutQuad: 起点 0 终点 1 且递增', () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(1)).toBe(1);
    expect(easeOutQuad(0.3)).toBeGreaterThan(0.3);
  });

  it('easeInQuad: 起点 0 终点 1 且递增', () => {
    expect(easeInQuad(0)).toBe(0);
    expect(easeInQuad(1)).toBe(1);
    expect(easeInQuad(0.3)).toBeLessThan(0.3);
  });
});

describe('particle style 函数', () => {
  it('makeHeartStyle: 起始位置/缩放/透明度正确', () => {
    const fn = makeHeartStyle(30, -40, 800);
    const s0 = fn(0);
    expect(s0.x).toBe(0);
    expect(s0.y).toBeCloseTo(0);
    expect(s0.scale).toBe(1);
    expect(s0.opacity).toBe(1);
    // 终点：位移到 dx/dy，缩小并淡出
    const s1 = fn(800);
    expect(s1.x).toBeCloseTo(30);
    expect(s1.y).toBeCloseTo(-40);
    expect(s1.scale).toBeCloseTo(0.5);
    expect(s1.opacity).toBeCloseTo(0);
  });

  it('makeExplosionStyle: 起点/终点正确', () => {
    const fn = makeExplosionStyle(20, 20, 600);
    expect(fn(0).scale).toBe(1);
    expect(fn(0).opacity).toBe(1);
    expect(fn(600).scale).toBeCloseTo(0);
    expect(fn(600).opacity).toBeCloseTo(0);
  });

  it('makeRocketStyle: 向上移动 + 变淡', () => {
    const fn = makeRocketStyle(50, 350);
    expect(fn(0).y).toBeCloseTo(0);
    expect(fn(0).opacity).toBe(1);
    expect(fn(350).y).toBeCloseTo(-50);
    expect(fn(350).opacity).toBeCloseTo(0.5);
  });

  it('makeBurstStyle: 向外射出 + 缩小', () => {
    const fn = makeBurstStyle(20, 20, 500);
    const s0 = fn(0);
    expect(s0.x).toBe(0);
    expect(s0.scale).toBe(1);
    const s1 = fn(500);
    expect(s1.x).toBe(20);
    expect(s1.scale).toBeCloseTo(0);
  });

  it('makeRippleStyle: 向外扩散', () => {
    const fn = makeRippleStyle(600);
    expect(fn(0).scale).toBe(1);
    expect(fn(600).scale).toBeCloseTo(7);
    expect(fn(600).opacity).toBeCloseTo(0);
  });

  it('makeStarStyle: 扩散 + 旋转 + 缩小', () => {
    const fn = makeStarStyle(30, 30, 700);
    const s0 = fn(0);
    expect(s0.rotate).toBe(0);
    expect(s0.scale).toBe(1);
    const s1 = fn(700);
    expect(s1.rotate).toBe(360);
    expect(s1.scale).toBeCloseTo(0.5);
  });

  it('makeSakuraStyle: 水平漂移 + 加速下落 + 旋转', () => {
    const fn = makeSakuraStyle(0, 20, 60, 1000);
    const s0 = fn(0);
    expect(s0.x).toBe(0);
    expect(s0.y).toBe(0);
    const s1 = fn(1000);
    expect(s1.x).toBe(20);
    expect(s1.y).toBe(60);
    expect(s1.rotate).toBe(540);
    expect(s1.opacity).toBeCloseTo(0);
  });
});
