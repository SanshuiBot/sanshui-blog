'use client';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextValue {
  /** 立即显示全屏骨架屏 */
  startNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  startNavigation: () => {},
});

export function useNavigationLoading() {
  return useContext(NavigationContext);
}

/** 旋转加载环（顶部居中）— SVG 原生 animateTransform，零 CSS 依赖 */
function Spinner() {
  return (
    <div className="flex items-center justify-center mb-10">
      <svg className="w-12 h-12" viewBox="0 0 48 48">
        {/* 底层：半透明背景环 */}
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
          className="text-black/[0.08] dark:text-white/[0.08]" />
        {/* 上层：渐变色旋转弧 — 用 SVG animateTransform 驱动旋转 */}
        <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
          strokeLinecap="round"
          stroke="url(#nav-spin-grad)"
          strokeDasharray="125.6"
          strokeDashoffset="31.4">
          <animateTransform attributeName="transform" type="rotate"
            from="-90 24 24" to="270 24 24"
            dur="0.8s" repeatCount="indefinite" />
        </circle>
        <defs>
          <linearGradient id="nav-spin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ff6ec7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** 加载文字 + 跳跃点 */
function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      <span className="text-sm font-medium text-black/40 dark:text-white/40">加载中</span>
      <span className="flex gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30"
            style={{
              animation: 'dot-bounce 0.8s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

/** 带流光扫过的骨架行 */
function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-black/[0.06] dark:bg-white/[0.06] ${className ?? 'h-4 w-full'}`}
    >
      {/* 流光扫光动画 — inline style 确保生效 */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] dark:via-white/[0.06] to-transparent"
        style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
      />
    </div>
  );
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // 监听路径变化 → 导航完成 → 隐藏覆盖层
  useEffect(() => {
    if (loading) {
      setLoading(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const startNavigation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    // 兜底：10秒后自动隐藏
    timerRef.current = setTimeout(() => {
      setLoading(false);
    }, 10000);
  }, []);

  return (
    <NavigationContext.Provider value={{ startNavigation }}>
      {/* 即时导航骨架屏覆盖层 — 自动匹配主题 */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col">
          {/* 覆盖层背景 */}
          <div className="absolute inset-0 bg-[#fafaf9] dark:bg-[#05050a]" />

          {/* 骨架内容 */}
          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
              {/* 顶部加载指示器 */}
              <Spinner />
              <LoadingDots />

              <div className="flex gap-10">
                <div className="flex-1 min-w-0 max-w-3xl">
                  {/* 返回按钮占位 */}
                  <SkeletonLine className="mb-8 h-4 w-20" />

                  {/* 标签占位 */}
                  <div className="flex gap-2 mb-5">
                    <SkeletonLine className="h-6 w-16 !rounded-full" />
                    <SkeletonLine className="h-6 w-20 !rounded-full" />
                    <SkeletonLine className="h-6 w-14 !rounded-full" />
                  </div>

                  {/* 标题占位 */}
                  <div className="mb-4 space-y-3">
                    <SkeletonLine className="h-10 w-3/4 !rounded-lg" />
                    <SkeletonLine className="h-10 w-1/2 !rounded-lg" />
                  </div>

                  {/* 日期与阅读时间占位 */}
                  <div className="flex items-center gap-4 mb-10">
                    <SkeletonLine className="h-4 w-32" />
                    <SkeletonLine className="h-4 w-28" />
                  </div>

                  {/* 分隔线 */}
                  <div className="h-px mb-10 bg-black/[0.06] dark:bg-white/[0.06]" />

                  {/* 内容段落占位 */}
                  <div className="space-y-4">
                    <SkeletonLine />
                    <SkeletonLine className="w-11/12" />
                    <SkeletonLine className="w-4/5" />
                    <SkeletonLine />
                    <SkeletonLine className="w-3/4" />
                    <SkeletonLine />
                    <SkeletonLine className="w-5/6" />
                    <SkeletonLine />
                    <SkeletonLine className="w-2/3" />
                    <SkeletonLine />
                    <SkeletonLine className="w-4/5" />
                  </div>
                </div>

                {/* TOC 侧栏占位 */}
                <div className="hidden lg:block sticky top-28 w-56 shrink-0 self-start ml-8">
                  <SkeletonLine className="h-3 w-12 mb-4" />
                  <div className="space-y-2 border-l border-black/[0.06] dark:border-white/[0.06] pl-3">
                    <SkeletonLine className="h-3 w-40" />
                    <SkeletonLine className="h-3 w-36" />
                    <SkeletonLine className="h-3 w-44" />
                    <SkeletonLine className="h-3 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </NavigationContext.Provider>
  );
}
