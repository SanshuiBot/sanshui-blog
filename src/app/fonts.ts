import { Inter, JetBrains_Mono, Noto_Serif_SC } from 'next/font/google';

/**
 * Optimized font stack via next/font.
 * - Self-hosted at build, no runtime CDN request
 * - Automatic preconnect + font-display swap
 * - Variable axes for fine-grained weight control
 */

export const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  fallback: ['SF Pro Display', 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', 'sans-serif'],
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  fallback: ['Fira Code', 'SF Mono', 'Consolas', 'monospace'],
});

// Noto Serif SC is large; load only the weights we actually use.
export const serif = Noto_Serif_SC({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '600', '700'],
  fallback: ['Source Serif Pro', 'Songti SC', 'serif'],
});
