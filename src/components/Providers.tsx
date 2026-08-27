'use client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { NavigationLoadingProvider } from '@/components/UI/NavigationLoading';
import ThemeColorSync from '@/components/UI/ThemeColorSync';

/**
 * 纯 Context 组合：next-themes + 导航加载 + framer-motion 配置。不包含任何 DOM 布局或动效。
 *
 * MotionConfig reducedMotion="never"：
 *  - 项目动效已自管 reduced-motion（CSS 全局 0.01ms 压制 + AmbientEffects 阀门 + 组件自研 matchMedia 订阅），
 *    不依赖 framer 的自动检测降级（dev 下它会对开启 reduced-motion 的设备打 warnOnce 噪音）。
 *  - 关闭 framer 侧自动降级：位移动画由项目自己的机制决定是否播放（与 ArrowLink 既定设计一致）。
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
          <MotionConfig reducedMotion="never">
            {/* 浏览器地址栏颜色跟随主题（需在 ThemeProvider 内读取 resolvedTheme） */}
            <ThemeColorSync />
            {children}
          </MotionConfig>
        </ThemeProvider>
      </NavigationLoadingProvider>
    </ErrorBoundary>
  );
}
