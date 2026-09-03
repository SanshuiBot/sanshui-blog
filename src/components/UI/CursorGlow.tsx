'use client';
import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  // 圆点（跟手快）与光晕（拖尾慢）用独立轨迹，形成「点在前、晕在后」的层次
  const pos = useRef({ x: -100, y: -100 });
  const glowPos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    let raf: number;
    const animate = () => {
      // lerp 系数：圆点 0.4（约 40ms 时间常数，几乎跟手）、光晕 0.15（氛围拖尾）
      pos.current.x += (target.current.x - pos.current.x) * 0.4;
      pos.current.y += (target.current.y - pos.current.y) * 0.4;
      glowPos.current.x += (target.current.x - glowPos.current.x) * 0.15;
      glowPos.current.y += (target.current.y - glowPos.current.y) * 0.15;
      // 合并为单次 style 写入，减少 reflow
      if (glowRef.current)
        glowRef.current.style.transform = `translate(${glowPos.current.x}px,${glowPos.current.y}px) translate(-50%,-50%)`;
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${pos.current.x}px,${pos.current.y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block" aria-hidden="true">
      <div
        ref={glowRef}
        className="absolute top-0 left-0 w-[200px] h-[200px] rounded-full"
        style={{
          background:
            'radial-gradient(circle,rgb(var(--accent-violet-rgb) / 0.08) 0%,rgb(var(--accent-pink-rgb) / 0.04) 30%,transparent 70%)',
          filter: 'blur(30px)',
          willChange: 'transform',
        }}
      />
      <div
        ref={dotRef}
        className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full border border-black/10 bg-black/5 backdrop-blur-sm dark:border-white/20 dark:bg-white/10"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
