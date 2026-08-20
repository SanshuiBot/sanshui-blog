'use client';

/**
 * 全局点击特效组件
 *
 * 监听 document 的 click 事件，在点击点随机释放一种特效：
 *  - 爱心喷射 / 爆炸粒子 / 烟花 / 涟漪波纹 / 星星飞溅 / 樱花飘落
 *
 * 分层约定：粒子物理（easing 曲线、位移/缩放/旋转/透明度推导）在
 * src/lib/clickParticles.ts（纯函数，可脱离浏览器单测）；
 * 本文件只保留 DOM 创建与 rAF 循环（副作用层）。
 */

import { useEffect } from 'react';
import {
  makeHeartStyle,
  makeExplosionStyle,
  makeRocketStyle,
  makeBurstStyle,
  makeRippleStyle,
  makeStarStyle,
  makeSakuraStyle,
  type ParticleState,
  type ParticleStyleFn,
} from '@/lib/clickParticles';

type EffectName = 'hearts' | 'explosion' | 'firework' | 'ripple' | 'stars' | 'sakura';

const EFFECTS: EffectName[] = ['hearts', 'explosion', 'firework', 'ripple', 'stars', 'sakura'];

// 复用一组柔和但能在暗色背景上突出的颜色
const PALETTE = [
  '#ff6b9d',
  '#ffd166',
  '#06d6a0',
  '#118ab2',
  '#ef476f',
  '#8338ec',
  '#ffadad',
  '#a0c4ff',
];

const HEART_SYMBOLS = ['❤', '♥', '❥', '💖'];
const STAR_SYMBOLS = ['✦', '✧', '⋆', '✨'];
const PETAL_COLORS = ['#ffd1dc', '#ffb3c6', '#ff8fab', '#ffc2d1'];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/**
 * 创建一个挂载在点击坐标处的容器 div，
 * 所有粒子都 append 到它，方便统一清理。
 */
function createLayer(x: number, y: number): HTMLDivElement {
  const layer = document.createElement('div');
  layer.style.position = 'fixed';
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  layer.style.zIndex = '9999';
  layer.style.pointerEvents = 'none';
  layer.style.transform = 'translate(-50%, -50%)';
  layer.dataset.effectLayer = 'true';
  document.body.appendChild(layer);
  return layer;
}

/** 副作用层：把纯函数算出的粒子状态写入元素样式（位移含 -50% 居中基准） */
function applyStyle(el: HTMLElement, s: ParticleState): void {
  const parts = [`translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px))`];
  if (s.rotate !== 0) parts.push(`rotate(${s.rotate}deg)`);
  if (s.scale !== 1) parts.push(`scale(${s.scale})`);
  el.style.transform = parts.join(' ');
  el.style.opacity = `${s.opacity}`;
}

/** 副作用层：rAF 循环，进度 t（ms）交给纯函数推导状态，到 duration 停止 */
function animate(el: HTMLElement, styleFn: ParticleStyleFn, duration: number): void {
  const start = performance.now();
  const loop = (now: number) => {
    const t = now - start;
    applyStyle(el, styleFn(t));
    if (t < duration) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/** 通用小圆点元素 */
function makeDot(size: number, color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50%';
  el.style.background = color;
  el.style.willChange = 'transform, opacity';
  return el;
}

/* ----------------------------- 特效实现（DOM 层） ----------------------------- */

/** 爱心喷射：多个小心以不同角度向上飘 */
function spawnHearts(layer: HTMLDivElement) {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.textContent = pick(HEART_SYMBOLS);
    heart.style.fontSize = `${rand(10, 16)}px`;
    heart.style.color = pick(PALETTE);
    heart.style.position = 'absolute';
    heart.style.willChange = 'transform, opacity';
    layer.appendChild(heart);

    const angle = rand(-Math.PI * 0.75, -Math.PI * 0.25); // 朝上
    const distance = rand(30, 60);
    const duration = rand(600, 1000);
    animate(
      heart,
      makeHeartStyle(Math.cos(angle) * distance, Math.sin(angle) * distance, duration),
      duration,
    );
  }
}

/** 爆炸粒子：从中心向四周射出小圆点 */
function spawnExplosion(layer: HTMLDivElement) {
  const count = 14;
  for (let i = 0; i < count; i++) {
    const dot = makeDot(rand(3, 6), pick(PALETTE));
    layer.appendChild(dot);

    const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
    const distance = rand(25, 55);
    const duration = rand(500, 800);
    animate(
      dot,
      makeExplosionStyle(Math.cos(angle) * distance, Math.sin(angle) * distance, duration),
      duration,
    );
  }
}

/** 烟花：先一个上升轨迹，到达顶点后爆开成粒子环 */
function spawnFirework(layer: HTMLDivElement) {
  const color = pick(PALETTE);
  const riseDuration = 350;
  const burstHeight = rand(40, 60);

  // 上升的"引线"粒子
  const rocket = makeDot(3, color);
  rocket.style.boxShadow = `0 0 6px ${color}`;
  layer.appendChild(rocket);

  const riseStart = performance.now();
  const riseLoop = (now: number) => {
    const t = now - riseStart;
    applyStyle(rocket, makeRocketStyle(burstHeight, riseDuration)(t));
    if (t < riseDuration) {
      requestAnimationFrame(riseLoop);
      return;
    }
    rocket.remove();
    // 爆开
    const burst = 12;
    for (let i = 0; i < burst; i++) {
      const p = makeDot(3, color);
      p.style.boxShadow = `0 0 4px ${color}`;
      p.style.top = `${-burstHeight}px`;
      layer.appendChild(p);

      const angle = (i / burst) * Math.PI * 2;
      const distance = rand(15, 30);
      const duration = rand(400, 700);
      animate(
        p,
        makeBurstStyle(Math.cos(angle) * distance, Math.sin(angle) * distance, duration),
        duration,
      );
    }
  };
  requestAnimationFrame(riseLoop);
}

/** 涟漪：从点击点向外扩散的圆环 */
function spawnRipple(layer: HTMLDivElement) {
  const ring = document.createElement('div');
  ring.style.position = 'absolute';
  ring.style.width = '10px';
  ring.style.height = '10px';
  ring.style.border = `2px solid ${pick(PALETTE)}`;
  ring.style.borderRadius = '50%';
  ring.style.willChange = 'transform, opacity';
  layer.appendChild(ring);

  animate(ring, makeRippleStyle(600), 600);
}

/** 星星飞溅：小星星字符向四周扩散并淡出 */
function spawnStars(layer: HTMLDivElement) {
  const count = 7;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.textContent = pick(STAR_SYMBOLS);
    star.style.fontSize = `${rand(9, 14)}px`;
    star.style.color = pick(PALETTE);
    star.style.position = 'absolute';
    star.style.willChange = 'transform, opacity';
    layer.appendChild(star);

    const angle = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
    const distance = rand(20, 45);
    const duration = rand(500, 800);
    animate(
      star,
      makeStarStyle(Math.cos(angle) * distance, Math.sin(angle) * distance, duration),
      duration,
    );
  }
}

/** 樱花飘落：花瓣从点击点附近缓慢飘落并旋转 */
function spawnSakura(layer: HTMLDivElement) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const size = rand(6, 10);
    const petal = document.createElement('div');
    petal.style.position = 'absolute';
    petal.style.width = `${size}px`;
    petal.style.height = `${size * 1.2}px`;
    petal.style.background = pick(PETAL_COLORS);
    petal.style.borderRadius = '150% 0 150% 0';
    petal.style.opacity = '0.9';
    petal.style.willChange = 'transform, opacity';
    layer.appendChild(petal);

    const duration = rand(900, 1400);
    animate(petal, makeSakuraStyle(rand(-15, 15), rand(-30, 30), rand(40, 80), duration), duration);
  }
}

const EFFECT_RENDERERS: Record<EffectName, (layer: HTMLDivElement) => void> = {
  hearts: spawnHearts,
  explosion: spawnExplosion,
  firework: spawnFirework,
  ripple: spawnRipple,
  stars: spawnStars,
  sakura: spawnSakura,
};

export default function ClickEffect() {
  useEffect(() => {
    // 活跃层计数器：快速点击时追踪未清理的层，卸载时统一清理
    let activeLayers = 0;

    const handleClick = (e: MouseEvent) => {
      const layer = createLayer(e.clientX, e.clientY);
      activeLayers++;
      const effect = pick(EFFECTS);
      EFFECT_RENDERERS[effect](layer);

      // 所有动画最长不超过 1.5s，到点统一清理
      const timer = window.setTimeout(() => {
        activeLayers--;
        if (layer.parentNode) layer.remove();
      }, 1500);
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleClick);
      // 卸载时清理所有尚未到期的层（防止内存泄漏）
      if (activeLayers > 0) {
        document.querySelectorAll<HTMLDivElement>('div[data-effect-layer="true"]').forEach(
          (el) => el.remove(),
        );
      }
    };
  }, []);

  return null;
}
