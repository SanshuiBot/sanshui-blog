'use client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from 'next-themes';
import { NavigationLoadingProvider } from '@/components/UI/NavigationLoading';
import ThemeColorSync from '@/components/UI/ThemeColorSync';

/**
 * 纯 Context 组合：next-themes + 导航加载。不包含任何 DOM 布局或动效。
 *
 * 已移除 MotionConfig（framer-motion）：首屏 layout 不再依赖 framer-motion 包，
 * 该依赖只随懒加载 chunk（Hero/Posts/Search 等）与页面级 chunk 进入。
 * framer-motion 的 reducedMotion 默认值即 "never"（源码 MotionConfigContext 默认），
 * 与原先显式配置行为一致——项目动效自管 reduced-motion
 * （CSS 全局 0.01ms 压制 + AmbientEffects 阀门 + 组件自研 matchMedia 订阅），
 * framer 侧不做自动降级。
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <NavigationLoadingProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="aurora-theme"
          disableTransitionOnChange
        >
          {/* 浏览器地址栏颜色跟随主题（需在 ThemeProvider 内读取 resolvedTheme） */}
          <ThemeColorSync />
          {children}
        </ThemeProvider>
      </NavigationLoadingProvider>
    </ErrorBoundary>
  );
}
