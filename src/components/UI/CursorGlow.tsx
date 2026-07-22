'use client';
import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY } };
    window.addEventListener('mousemove', onMove, { passive: true });
    let raf: number;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (glowRef.current) glowRef.current.style.transform = `translate(${pos.current.x}px,${pos.current.y}px) translate(-50%,-50%)`;
      if (dotRef.current) dotRef.current.style.transform = `translate(${target.current.x}px,${target.current.y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block" aria-hidden="true">
      <div ref={glowRef} className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,rgba(255,110,199,0.03) 30%,transparent 70%)', filter: 'blur(50px)', willChange: 'transform' }} />
      <div ref={dotRef} className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm"
        style={{ willChange: 'transform' }} />
    </div>
  );
}
