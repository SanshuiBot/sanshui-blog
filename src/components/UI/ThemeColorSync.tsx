'use client';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { THEME_COLORS } from '@/lib/accents';

/**
 * 浏览器地址栏/任务栏颜色跟随主题 —— 动态同步 <meta name="theme-color">。
 * -----------------------------
 * layout.tsx 的 viewport.themeColor 是静态值（默认亮色），暗色模式下
 * 浏览器 UI 仍按亮色渲染地址栏。本组件挂在 Providers 内，监听
 * resolvedTheme 变化并更新 meta content（暗色 / 亮色取 THEME_COLORS）。
 * 首屏前的初始值由 themeBootstrapScript（layout.tsx head 内联）同步设置，
 * 本组件只负责 hydration 之后的运行时切换。
 */
export default function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute('content', resolvedTheme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light);
  }, [resolvedTheme]);

  return null;
}
