/**
 * 点击特效粒子物理计算 —— 纯函数层，无 DOM 依赖，可脱离浏览器单测。
 *
 * 用法：
 *  - 每种效果通过 createParticleFactory 生成一个 (t: number) => ParticleState 纯函数，
 *    输入进度 t ∈ [0,1]，返回该时刻的位移/缩放/旋转/透明度。
 *  - 组件层只需调用工厂函数得到 styleFn，然后在 rAF 循环中调用 styleFn(t) 并将结果
 *    写入 DOM 元素 style 属性。
 */

export interface ParticleState {
  /** 水平/垂直位移（px） */
  x: number;
  y: number;
  /** 缩放（1 = 原始大小） */
  scale: number;
  /** 透明度（0 ~ 1） */
  opacity: number;
  /** 旋转角度（deg） */
  rotate: number;
}

export type ParticleStyleFn = (t: number) => ParticleState;

/* ---------- easing 曲线（纯） ---------- */

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutQuad(t: number): number {
  return 1 - Math.pow(1 - t, 2);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeLinear(t: number): number {
  return t;
}

/* ---------- 各效果的状态推导函数（纯） ---------- */

/** 爱心喷射：向上飘 + 缩小 + 淡出 */
export function makeHeartStyle(dx: number, dy: number, duration: number): ParticleStyleFn {
  return (t: number) => {
    const p = Math.min(t / duration, 1);
    const e = easeOutCubic(p);
    return { x: dx * e, y: dy * e, scale: 1 - p * 0.5, opacity: 1 - p, rotate: 0 };
  };
}

/** 爆炸粒子：向四周射出 + 缩小 + 淡出 */
export function makeExplosionStyle(dx: number, dy: number, duration: number): ParticleStyleFn {
  return (t: number) => {
    const p = Math.min(t / duration, 1);
    const e = easeOutQuad(p);
    return { x: dx * e, y: dy * e, scale: 1 - p, opacity: 1 - p, rotate: 0 };
  };
}

/** 烟花火箭上升：向上移动 + 逐渐变淡 */
export function makeRocketStyle(burstHeight: number, duration: number): ParticleStyleFn {
  return (t: number) => {
    const p = Math.min(t / duration, 1);
    return { x: 0, y: -burstHeight * p, scale: 1, opacity: 1 - p * 0.5, rotate: 0 };
  };
}

/** 烟花爆裂粒子：向四周射出 + 缩小 + 淡出 */
export function makeBurstStyle(dx: number, dy: number, duration: number): ParticleStyleFn {
  return (t: number) => {
    const p = Math.min(t / duration, 1);
    return { x: dx * p, y: dy * p, scale: 1 - p, opacity: 1 - p, rotate: 0 };
  };
}

/** 涟漪：向外扩散圆环 + 淡出 */
export function makeRippleStyle(duration: number): ParticleStyleFn {
  return (t: number) => {
    const p = Math.min(t / duration, 1);
    const scale = 1 + p * 6;
    return { x: 0, y: 0, scale, opacity: 1 - p, rotate: 0 };
  };
}

/** 星星飞溅：向四周扩散 + 旋转 + 缩小 + 淡出 */
export function makeStarStyle(dx: number, dy: number, duration: number): ParticleStyleFn {
  return (t: number) => {
    const p = Math.min(t / duration, 1);
    const e = easeOutQuad(p);
    return { x: dx * e, y: dy * e, scale: 1 - p * 0.5, opacity: 1 - p, rotate: p * 360 };
  };
}

/** 樱花飘落：水平漂移 + 加速下落 + 旋转 + 淡出 */
export function makeSakuraStyle(
  startX: number,
  drift: number,
  fall: number,
  duration: number,
): ParticleStyleFn {
  return (t: number) => {
    const p = Math.min(t / duration, 1);
    const e = easeInQuad(p);
    return {
      x: startX + drift * p,
      y: fall * e,
      scale: 1,
      opacity: 0.9 * (1 - p),
      rotate: p * 540,
    };
  };
}
