import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// next/font 会自动注入 <link rel="preload"> 到 <head>，并内联 @font-face CSS。
// display: 'swap' 在字体加载期间先用 fallback，加载完切换——配合 preload 几乎无 FOUT。
// 可变字体：省略 weight 即下载单文件可变 woff2（覆盖全部字重 400-900，
// 含 font-black），替代逐字重多文件——13 个 woff2 → 2 个，请求数与体积双降。
export const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['SF Pro Display', 'PingFang SC', 'Noto Sans SC', 'sans-serif'],
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  fallback: ['Fira Code', 'SF Mono', 'Consolas', 'monospace'],
});

// Hero 标题用的本地中文圆体：寒蝉圆黑体 Bold（ChillRoundGothic，SIL OFL 开源），
// 已按标题用字裁剪成子集（122 字形，~20KB），避免整包 10MB+。
// 扩展：如果标题文案改动用到子集外的字，会回退到系统字体——
// 重新跑裁剪脚本把新字加进 text 后替换 woff2 即可。
export const serifSC = localFont({
  src: './fonts/ChillRoundM-Hero-subset.woff2',
  weight: '700',
  display: 'swap',
  variable: '--font-serif-next',
  fallback: ['Yuanti SC', 'YouYuan', 'PingFang SC', 'sans-serif'],
});
