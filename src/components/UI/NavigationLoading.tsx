'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { useSafeTimeout } from '@/components/UI/useSafeTimeout';
import SpinRing from '@/components/UI/SpinRing';

interface NavigationContextValue {
  /** 点击后触发导航加载：延迟 300ms 显示全屏覆盖层（快跳转时不可见） */
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface/95 dark:bg-ink/95 backdrop-blur-sm">
      <SpinRing sizeClass="w-14 h-14" gradId="nav-spin-grad" />
    </div>
  );
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  // 2 个卸载安全的定时器（useSafeTimeout 自动 cleanup，见 ADR-0003）：
  // showTimer 延迟 300ms 显示覆盖层；fallbackTimer 兜底 5 秒自动 clear
  const setShowTimer = useSafeTimeout();
  const setFallbackTimer = useSafeTimeout();

  const clear = useCallback(() => {
    // useSafeTimeout 返回的 cancel 未导出——重设 noop 触发内部清上一个
    setShowTimer(() => {}, 0);
    setFallbackTimer(() => {}, 0);
    setLoading(false);
  }, [setShowTimer, setFallbackTimer]);

  const done = useCallback(() => {
    clear();
  }, [clear]);

  const startNavigation = useCallback(() => {
    // 延迟 300ms 显示覆盖层：快跳转（< 300ms）根本看不到覆盖层，
    // 慢跳转才显示，避免用户误以为卡死。
    setShowTimer(() => setLoading(true), 300);
    // 兜底 5 秒（正常情况下 PostPage 挂载时 done() 在 ms 级触发）
    setFallbackTimer(clear, 5000);
  }, [setShowTimer, setFallbackTimer, clear]);

  return (
    <NavigationContext.Provider value={{ startNavigation, done }}>
      {loading && <Overlay />}
      {children}
    </NavigationContext.Provider>
  );
}
