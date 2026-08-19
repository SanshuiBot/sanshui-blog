/**
 * 根布局（Root Layout）
 * -----------------------------
 * 作用：Next.js App Router 的顶层布局，所有页面（包括 404）都会被它包裹。
 *       在此处注入全局字体、Provider（主题/光标/导航加载等）以及 SEO metadata。
 *
 * 用法：
 *  - 这是服务端组件，仅在服务端运行一次；客户端交互能力由 <Provider> 下的子组件提供。
 *  - 全站字体（sans / mono）通过 CSS 变量挂到 <html>，globals.css 中的 font-family 引用这些变量。
 *  - metadata 与 viewport 在此集中导出，子页面通过自己的 `export const metadata` 覆盖标题等字段。
 *  - 切勿在此处引入任何客户端专用逻辑或 'use client' 组件本体，应统一交给 <Provider>。
 */
import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { sans, mono } from './fonts';
import Providers from '@/components/Providers';
import AmbientEffects from '@/components/AmbientEffects';
import AppShell from '@/components/AppShell';
import { withBase } from '@/lib/basePath';
import { siteConfig } from '@/lib/site';
import { accentBootstrapScript, themeBootstrapScript } from '@/lib/accents';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: [siteConfig.name, '个人博客', '技术博客', 'Next.js', 'React', 'TypeScript'],
  authors: [{ name: siteConfig.name, url: `${siteConfig.url}/about` }],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.blogName,
    locale: 'zh_CN',
    // 分享卡片图：scripts/gen-og-image.js 生成（prebuild 自动重建）
    images: [
      { url: withBase('/og.png'), width: 1200, height: 630, alt: `${siteConfig.blogName} 封面` },
    ],
  },
  twitter: { card: 'summary_large_image', images: [withBase('/og.png')] },
  icons: {
    icon: [
      { url: withBase('/favicon.svg'), type: 'image/svg+xml' },
      { url: withBase('/favicon.ico'), sizes: 'any' },
    ],
    shortcut: withBase('/favicon.ico'),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafaf9',
  // light dark：让原生滚动条/表单控件按站点主题渲染（暗色下不再强制亮色）。
  // 实际值由 CSS `color-scheme`（globals.css :root / html.dark）跟随主题类驱动，
  // 浏览器地址栏颜色由 ThemeColorSync 动态同步。
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* 防 FOUC：首屏前同步应用上次的 accent。脚本由 accents.ts 生成，与 resolveAccentColors 共享数据源 */}
        <script dangerouslySetInnerHTML={{ __html: accentBootstrapScript }} />
        {/* 防 FOUC：首屏前同步设 .dark 类（next-themes 的 ThemeProvider 渲染在 <body> 内，其内联 script 进不了 <head>） */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-dvh flex flex-col bg-ink text-fg antialiased relative">
        <Providers>
          <AmbientEffects />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
