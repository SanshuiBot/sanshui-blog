'use client';

import { useEffect, useRef } from 'react';
import { useMouseMoveTransform } from '@/lib/hooks';

export default function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useMouseMoveTransform();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const colors = [
      { r: 220, g: 38, b: 38 }, // red
      { r: 234, g: 88, b: 12 }, // orange
      { r: 168, g: 162, b: 158 }, // stone
      { r: 28, g: 25, b: 23 }, // near black
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const blobs = Array.from({ length: 5 }, (_, i) => {
      const color = colors[i % colors.length]!;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 200 + Math.random() * 300,
        color,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const render = () => {
      time += 0.002;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Update blob positions with mouse influence
      blobs.forEach((blob) => {
        blob.x += blob.vx + Math.sin(time + blob.phase) * 0.2;
        blob.y += blob.vy + Math.cos(time * 0.7 + blob.phase) * 0.2;

        // Mouse influence
        if (mouse.current) {
          const dx = mouse.current.x - blob.x;
          const dy = mouse.current.y - blob.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 400) {
            blob.x += (dx / dist) * 0.2;
            blob.y += (dy / dist) * 0.2;
          }
        }

        // Wrap around edges
        if (blob.x < -blob.radius) blob.x = w + blob.radius;
        if (blob.x > w + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = h + blob.radius;
        if (blob.y > h + blob.radius) blob.y = -blob.radius;

        // Radial gradient blob
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.12)`);
        gradient.addColorStop(0.5, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.06)`);
        gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(blob.x - blob.radius, blob.y - blob.radius, blob.radius * 2, blob.radius * 2);
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [mouse]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
