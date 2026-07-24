'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

interface NavigationContextValue {
  /** 点击后立即显示全屏加载覆盖层 */
  startNavigation: () => void;
  /** 新页面内容已挂载到 DOM，通知覆盖层隐藏 */
  done: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  startNavigation: () => {},
  done: () => {},
});

export function useNavigationLoading() {
  return useContext(NavigationContext);
}

/** 覆盖层 - 全屏居中旋转加载环，带主题自适应蒙层 */
function Overlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fafaf9]/95 dark:bg-[#05050a]/95 backdrop-blur-sm">
      <svg className="w-14 h-14" viewBox="0 0 48 48">
        {/* 底层环 */}
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
          className="text-black/[0.08] dark:text-white/[0.08]" />
        {/* 上层旋转弧 */}
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

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    setLoading(false);
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }
  }, []);

  const done = useCallback(() => {
    clear();
  }, [clear]);

  const startNavigation = useCallback(() => {
    if (fallbackRef.current) clearTimeout(fallbackRef.current);
    setLoading(true);
    // 兜底 5 秒（正常情况下 PostPage 挂载时 done() 在 ms 级触发）
    fallbackRef.current = setTimeout(clear, 5000);
  }, [clear]);

  return (
    <NavigationContext.Provider value={{ startNavigation, done }}>
      {loading && <Overlay />}
      {children}
    </NavigationContext.Provider>
  );
}
