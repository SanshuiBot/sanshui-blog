import { Inter, JetBrains_Mono, Noto_Serif_SC } from 'next/font/google';

/**
 * Optimized font stack via next/font.
 * - Self-hosted at build, no runtime CDN request
 * - Automatic preconnect + font-display swap
 * - Variable axes for fine-grained weight control
 *
 * Performance notes:
 *   - Inter & JetBrains Mono are the LCP-critical fonts; they are preloaded
 *     automatically by next/font because they are attached to <html>.
 *   - Noto Serif SC is heavy (full CJK glyph set). We disable preload and
 *     load only the latin subset for fallback metrics; Chinese users get
 *     the system serif (Songti SC / Source Han Serif) via the fallback
 *     stack, avoiding a multi-MB download.
 *   - All fonts use display: 'swap' to eliminate FOIT.
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
// preload: false — the serif font is decorative (used in prose headings);
// preloading it would compete with the LCP-critical Inter font for bandwidth.
export const serif = Noto_Serif_SC({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '600', '700'],
  preload: false,
  fallback: ['Source Serif Pro', 'Songti SC', 'serif'],
});
