'use client';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { NavigationLoadingProvider } from '@/components/UI/NavigationLoading';

// 懒加载非首屏必需的 client 组件，避免被打进首屏 chunk 图
const CursorGlow = dynamic(() => import('@/components/UI/CursorGlow'), { ssr: false });
const ScrollProgress = dynamic(() => import('@/components/Layout/ScrollProgress'), {
  ssr: false,
});
const ClickEffect = dynamic(() => import('@/components/UI/ClickEffect'), { ssr: false });

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLoadingProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="aurora-theme">
        <CursorGlow />
        <ScrollProgress />
        <ClickEffect />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </ThemeProvider>
    </NavigationLoadingProvider>
  );
}
