'use client';
import { ThemeProvider } from 'next-themes';
import { NavigationLoadingProvider } from '@/components/UI/NavigationLoading';

/** 纯 Context 组合：next-themes + 导航加载。不包含任何 DOM 布局或动效。 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLoadingProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="aurora-theme"
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </NavigationLoadingProvider>
  );
}
