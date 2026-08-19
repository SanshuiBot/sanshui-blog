'use client';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * 浏览器地址栏/任务栏颜色跟随主题 —— 动态同步 <meta name="theme-color">。
 * -----------------------------
 * layout.tsx 的 viewport.themeColor 是静态值（默认亮色），暗色模式下
 * 浏览器 UI 仍按亮色渲染地址栏。本组件挂在 Providers 内，监听
 * resolvedTheme 变化并更新 meta content（暗色 #05050a / 亮色 #fafaf9）。
 */
export default function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute('content', resolvedTheme === 'dark' ? '#05050a' : '#fafaf9');
  }, [resolvedTheme]);

  return null;
}
