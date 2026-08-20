'use client';
import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    let raf: number;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      // 合并为单次 style 写入，减少 reflow
      const tx = pos.current.x;
      const ty = pos.current.y;
      if (glowRef.current)
        glowRef.current.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
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
        className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
