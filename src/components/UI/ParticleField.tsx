'use client';
import { useEffect, useRef } from 'react';

/**
 * 全局发光粒子背景
 * -----------------------------
 * Canvas 2D 粒子动画，fixed 铺满视口、位于内容层之下（z-[-1]），
 * 所有页面（首页/关于/归档/标签/文章/友链）共享同一套粒子系统。
 *
 * 加载与性能：
 *  - Provider 中用 dynamic(..., { ssr: false }) 懒加载，不进首屏 chunk、不阻塞首屏渲染；
 *  - 挂载后仅跑一个 requestAnimationFrame 循环，成本与原 Hero 内 canvas 一致；
 *  - 标签页切到后台时暂停动画（visibilitychange），切回时恢复；
 *  - prefers-reduced-motion 下只画一帧静态画面，不跑动画循环。
 *
 * 颜色：粒子连线色读取 --accent-violet-rgb（Accent 主题联动），Canvas 无法直接用
 * CSS 变量，故用 getComputedStyle 取值，与原实现一致。
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 读取 Accent 主题色 CSS 变量，用于 Canvas strokeStyle（Canvas 无法直接用 CSS 变量）
    const accentViolet = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-violet-rgb')
      .trim();
    const parts = accentViolet.split(/\s+/).map(Number);
    const vr = parts[0] ?? 168;
    const vg = parts[1] ?? 85;
    const vb = parts[2] ?? 247;
    let w = 0,
      h = 0;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      hue: number;
    }[] = [];
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const count = Math.min(60, Math.floor((w * h) / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        hue: [280, 320, 200, 170, 40][Math.floor(Math.random() * 5)]!,
      });
    }
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},70%,65%,${p.alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i]!.x - particles[j]!.x;
          const dy = particles[i]!.y - particles[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i]!.x, particles[i]!.y);
            ctx.lineTo(particles[j]!.x, particles[j]!.y);
            ctx.strokeStyle = `rgba(${vr},${vg},${vb},${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    // prefers-reduced-motion：只画一帧静态画面，不跑动画循环
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      draw();
    } else if (!document.hidden) {
      raf = requestAnimationFrame(loop);
    }
    // 标签页不可见时暂停 rAF 循环，切回时恢复（省电）
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none"
      aria-hidden="true"
    />
  );
}
