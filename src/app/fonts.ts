import { Inter, JetBrains_Mono } from 'next/font/google';

// next/font 会自动注入 <link rel="preload"> 到 <head>，并内联 @font-face CSS。
// display: 'swap' 在字体加载期间先用 fallback，加载完切换——配合 preload 几乎无 FOUT。
export const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  fallback: ['SF Pro Display', 'PingFang SC', 'Noto Sans SC', 'sans-serif'],
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  fallback: ['Fira Code', 'SF Mono', 'Consolas', 'monospace'],
});
