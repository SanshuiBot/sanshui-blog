'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';
import GradientText from '@/components/GradientText';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function NotFound() {
  const [glitch, setGlitch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const randomPositions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: seededRandom(i * 7 + 1) * 100,
      y: seededRandom(i * 11 + 3) * 100,
      size: 2 + seededRandom(i * 13 + 5) * 4,
      delay: seededRandom(i * 17 + 7) * 5,
      duration: 3 + seededRandom(i * 19 + 9) * 4,
      hue: Math.floor(seededRandom(i * 23 + 11) * 360),
    }));
  }, []);

  const glitchOffsets = useMemo(
    () => ({
      shadow: { x: seededRandom(101) * 6 - 3, y: seededRandom(102) * 6 - 3 },
      main: { x: seededRandom(103) * 6 - 3, y: seededRandom(104) * 6 - 3 },
    }),
    [glitch],
  );

  return (
    <ErrorBoundary>
      <div className="min-h-[80dvh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Floating particles */}
        {randomPositions.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: ['#f472b6', '#c084fc', '#60a5fa', '#34d399'][i % 4],
              boxShadow: `0 0 ${p.size * 3}px ${['#f472b6', '#c084fc', '#60a5fa', '#34d399'][i % 4]}`,
              animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}

        <div ref={containerRef} className="relative text-center max-w-md">
          {/* Glitch 404 */}
          <div className="relative mb-6">
            <div className="relative">
              {/* Shadow layer */}
              <div
                className="absolute inset-0 text-8xl font-bold text-pink-500/30 leading-none"
                style={{
                  transform: glitch
                    ? `translate(${glitchOffsets.shadow.x}px, ${glitchOffsets.shadow.y}px)`
                    : 'none',
                  transition: 'transform 0.1s',
                }}
              >
                404
              </div>
              {/* Main layer */}
              <div
                className="text-8xl font-bold leading-none relative"
                style={{
                  transform: glitch
                    ? `translate(${glitchOffsets.main.x}px, ${glitchOffsets.main.y}px)`
                    : 'none',
                  transition: 'transform 0.1s',
                }}
              >
                <GradientText mode="holo" size="xl" glow>404</GradientText>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
            <Compass size={12} />
            迷路了
          </div>

          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3 text-balance">
            页面走丢了
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mb-8 text-pretty">
            抱歉，你访问的页面不存在或已被移除。也许可以回到首页，或者去归档看看.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform light-ray"
            >
              <Home size={16} />
              返回首页
            </Link>
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-iridescent light-ray"
            >
              <ArrowLeft size={16} />
              浏览归档
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
