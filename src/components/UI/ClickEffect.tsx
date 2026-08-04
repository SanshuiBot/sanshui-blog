'use client';

/**
 * 全局点击特效组件
 *
 * 监听 document 的 click 事件，在点击点随机释放一种特效：
 *  - 爱心喷射
 *  - 爆炸粒子
 *  - 烟花
 *  - 涟漪波纹
 *  - 星星飞溅
 *  - 樱花飘落
 *
 * 特效由纯 CSS + JS 动画实现，不引入任何第三方依赖；元素在动画结束后自动移除。
 * 为了避免在不可点击的纯文本区域过于吵闹，特效整体保持小巧、克制的视觉风格。
 */

import { useEffect } from 'react';

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
  document.body.appendChild(layer);
  return layer;
}

/* ----------------------------- 特效实现 ----------------------------- */

/** 爱心喷射：多个小心以不同角度向上飘 */
function spawnHearts(layer: HTMLDivElement) {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.textContent = pick(['❤', '♥', '❥', '💖']);
    heart.style.position = 'absolute';
    heart.style.fontSize = `${rand(10, 16)}px`;
    heart.style.color = pick(PALETTE);
    heart.style.opacity = '1';
    heart.style.transform = 'translate(-50%, -50%)';
    heart.style.willChange = 'transform, opacity';

    const angle = rand(-Math.PI * 0.75, -Math.PI * 0.25); // 朝上
    const distance = rand(30, 60);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const duration = rand(600, 1000);

    layer.appendChild(heart);

    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      heart.style.transform = `translate(calc(-50% + ${dx * ease}px), calc(-50% + ${dy * ease}px)) scale(${1 - t * 0.5})`;
      heart.style.opacity = `${1 - t}`;
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

/** 爆炸粒子：从中心向四周射出小圆点 */
function spawnExplosion(layer: HTMLDivElement) {
  const count = 14;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    const size = rand(3, 6);
    dot.style.position = 'absolute';
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.borderRadius = '50%';
    dot.style.background = pick(PALETTE);
    dot.style.transform = 'translate(-50%, -50%)';
    dot.style.willChange = 'transform, opacity';

    const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
    const distance = rand(25, 55);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const duration = rand(500, 800);

    layer.appendChild(dot);

    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      dot.style.transform = `translate(calc(-50% + ${dx * ease}px), calc(-50% + ${dy * ease}px)) scale(${1 - t})`;
      dot.style.opacity = `${1 - t}`;
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

/** 烟花：先一个上升轨迹，到达顶点后爆开成粒子环 */
function spawnFirework(layer: HTMLDivElement) {
  const color = pick(PALETTE);
  const riseDuration = 350;
  const burstHeight = rand(40, 60);

  // 上升的"引线"粒子
  const rocket = document.createElement('div');
  rocket.style.position = 'absolute';
  rocket.style.width = '3px';
  rocket.style.height = '3px';
  rocket.style.borderRadius = '50%';
  rocket.style.background = color;
  rocket.style.boxShadow = `0 0 6px ${color}`;
  rocket.style.transform = 'translate(-50%, -50%)';
  rocket.style.willChange = 'transform, opacity';
  layer.appendChild(rocket);

  const riseStart = performance.now();
  const riseAnimate = (now: number) => {
    const t = Math.min((now - riseStart) / riseDuration, 1);
    rocket.style.transform = `translate(-50%, calc(-50% - ${burstHeight * t}px))`;
    rocket.style.opacity = `${1 - t * 0.5}`;
    if (t < 1) {
      requestAnimationFrame(riseAnimate);
    } else {
      rocket.remove();
      // 爆开
      const burst = 12;
      for (let i = 0; i < burst; i++) {
        const p = document.createElement('div');
        p.style.position = 'absolute';
        p.style.left = '0';
        p.style.top = `${-burstHeight}px`;
        p.style.width = '3px';
        p.style.height = '3px';
        p.style.borderRadius = '50%';
        p.style.background = color;
        p.style.boxShadow = `0 0 4px ${color}`;
        p.style.transform = 'translate(-50%, -50%)';
        p.style.willChange = 'transform, opacity';
        layer.appendChild(p);

        const angle = (i / burst) * Math.PI * 2;
        const distance = rand(15, 30);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const duration = rand(400, 700);
        const start = performance.now();
        const animate = (now2: number) => {
          const t2 = Math.min((now2 - start) / duration, 1);
          p.style.transform = `translate(calc(-50% + ${dx * t2}px), calc(-50% + ${dy * t2}px)) scale(${1 - t2})`;
          p.style.opacity = `${1 - t2}`;
          if (t2 < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }
  };
  requestAnimationFrame(riseAnimate);
}

/** 涟漪：从点击点向外扩散的圆环 */
function spawnRipple(layer: HTMLDivElement) {
  const ring = document.createElement('div');
  ring.style.position = 'absolute';
  ring.style.width = '10px';
  ring.style.height = '10px';
  ring.style.border = `2px solid ${pick(PALETTE)}`;
  ring.style.borderRadius = '50%';
  ring.style.transform = 'translate(-50%, -50%)';
  ring.style.willChange = 'transform, opacity';
  layer.appendChild(ring);

  const duration = 600;
  const start = performance.now();
  const animate = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const scale = 1 + t * 6;
    ring.style.transform = `translate(-50%, -50%) scale(${scale})`;
    ring.style.opacity = `${1 - t}`;
    if (t < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

/** 星星飞溅：小星星字符向四周扩散并淡出 */
function spawnStars(layer: HTMLDivElement) {
  const count = 7;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.textContent = pick(['✦', '✧', '⋆', '✨']);
    star.style.position = 'absolute';
    star.style.fontSize = `${rand(9, 14)}px`;
    star.style.color = pick(PALETTE);
    star.style.transform = 'translate(-50%, -50%)';
    star.style.willChange = 'transform, opacity';
    layer.appendChild(star);

    const angle = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
    const distance = rand(20, 45);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const duration = rand(500, 800);
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      star.style.transform = `translate(calc(-50% + ${dx * ease}px), calc(-50% + ${dy * ease}px)) rotate(${t * 360}deg) scale(${1 - t * 0.5})`;
      star.style.opacity = `${1 - t}`;
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

/** 樱花飘落：花瓣从点击点附近缓慢飘落并旋转 */
function spawnSakura(layer: HTMLDivElement) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    const size = rand(6, 10);
    petal.style.position = 'absolute';
    petal.style.width = `${size}px`;
    petal.style.height = `${size * 1.2}px`;
    petal.style.background = pick(['#ffd1dc', '#ffb3c6', '#ff8fab', '#ffc2d1']);
    petal.style.borderRadius = '150% 0 150% 0';
    petal.style.opacity = '0.9';
    petal.style.transform = 'translate(-50%, -50%)';
    petal.style.willChange = 'transform, opacity';
    layer.appendChild(petal);

    const startX = rand(-15, 15);
    const drift = rand(-30, 30);
    const fall = rand(40, 80);
    const duration = rand(900, 1400);
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = t * t; // 加速下落
      petal.style.transform = `translate(calc(-50% + ${startX + drift * t}px), calc(-50% + ${fall * ease}px)) rotate(${t * 540}deg)`;
      petal.style.opacity = `${0.9 * (1 - t)}`;
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
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
    const handleClick = (e: MouseEvent) => {
      const layer = createLayer(e.clientX, e.clientY);
      const effect = pick(EFFECTS);
      EFFECT_RENDERERS[effect](layer);

      // 所有动画最长不超过 1.5s，到点统一清理
      window.setTimeout(() => {
        layer.remove();
      }, 1500);
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
