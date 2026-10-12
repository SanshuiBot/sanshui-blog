import type { MetadataRoute } from 'next';
import { BASE_PATH, withBase } from '@/lib/basePath';
import { siteConfig } from '@/lib/site';
import { THEME_COLORS } from '@/lib/accents';

/**
 * PWA manifest（文件约定 src/app/manifest.ts → 导出 /manifest.webmanifest，
 * Next 自动在 <head> 注入 <link rel="manifest">，basePath 随框架注入）。
 * - start_url/scope/icons 手动拼 BASE_PATH：manifest 内 URL 是原样输出的裸字符串，
 *   不经过 <Link> 的自动 basePath 注入（红线 #1 的原生资源同款规则）
 * - 图标由 public/logo.svg 经 sharp 一次性派生：icon-192/512 放 public/，
 *   apple-icon.png 走 src/app/apple-icon.png 文件约定（自动生成 link 标签）
 * - 不设 revalidate（force-static 缓存，与 sitemap 同构，红线 #41）
 */
export const dynamic = 'force-static' as const;

export default function manifest(): MetadataRoute.Manifest {
  const root = `${BASE_PATH}/`;
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: root,
    scope: root,
    display: 'standalone',
    lang: 'zh-CN',
    dir: 'ltr',
    // 亮色底色与 body 底色 / ThemeColorSync / themeBootstrapScript 共用 THEME_COLORS
    //（#fafaf9）：启动屏与首屏无缝衔接不断层，地址栏/任务栏配色也一致，魔法 hex 不散落
    background_color: THEME_COLORS.light,
    theme_color: THEME_COLORS.light,
    icons: [
      {
        src: withBase('/icon-192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: withBase('/icon-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: withBase('/icon-512.png'),
        sizes: '512x512',
        type: 'image/png',
        // logo 满铺（自有米白底 + 居中花瓣），遮罩裁切安全区内仍可辨
        purpose: 'maskable',
      },
    ],
  };
}
