'use client';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundContent() {
  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              left: `${10 + ((i * 8) % 90)}%`,
              top: `${10 + ((i * 13) % 80)}%`,
              width: `${2 + (i % 3) * 3}px`,
              height: `${2 + (i % 3) * 3}px`,
              background: [
                'rgb(var(--accent-pink-rgb))',
                'rgb(var(--accent-violet-rgb))',
                'rgb(var(--accent-blue-rgb))',
                'rgb(var(--accent-teal-rgb))',
              ][i % 4]!,
              boxShadow: `0 0 ${4 + (i % 3) * 4}px ${['rgb(var(--accent-pink-rgb))', 'rgb(var(--accent-violet-rgb))', 'rgb(var(--accent-blue-rgb))', 'rgb(var(--accent-teal-rgb))'][i % 4]}`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.7}s`,
            }}
          />
        ))}
      </div>
      <div className="relative text-center max-w-md">
        <div className="relative mb-6">
          <div className="text-9xl font-black leading-none text-aurora tracking-tighter">404</div>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-3 dark:text-white">页面走丢了</h1>
        <p className="text-stone-500 mb-10 dark:text-gray-500">抱歉，你访问的页面不存在。</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-solid text-sm font-medium hover:scale-105 active:scale-95 transition-transform"
          >
            <Home size={16} />
            返回首页
          </Link>
          <Link
            href="/archive/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/[0.03] text-stone-700 text-sm font-medium border border-black/[0.1] hover:scale-105 active:scale-95 transition-transform dark:bg-white/5 dark:text-gray-300 dark:border-white/10 hover:border-accent-violet/40"
          >
            <ArrowLeft size={16} />
            浏览归档
          </Link>
        </div>
      </div>
    </div>
  );
}
