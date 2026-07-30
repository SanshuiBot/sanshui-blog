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
import './globals.css';
import { sans, mono } from './fonts';
import Provider from '@/components/Provider';
import { BASE_PATH } from '@/lib/basePath';

const base = 'https://sanshuibot.github.io/sanshui-blog';

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: '三水 | 个人博客', template: '%s | 三水' },
  description: '记录技术思考、生活感悟与创作灵感',
  keywords: ['三水', '个人博客', '技术博客', 'Next.js', 'React', 'TypeScript'],
  authors: [{ name: '三水', url: `${base}/about` }],
  openGraph: {
    title: '三水 | 个人博客',
    description: '记录技术思考、生活感悟与创作灵感',
    url: base,
    siteName: '三水博客',
    locale: 'zh_CN',
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon.svg`, type: 'image/svg+xml' },
      { url: `${BASE_PATH}/favicon.ico`, sizes: 'any' },
    ],
    shortcut: `${BASE_PATH}/favicon.ico`,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafaf9',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh flex flex-col bg-ink text-fg antialiased relative">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
