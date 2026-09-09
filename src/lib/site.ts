/**
 * 站点全局公共配置
 * -----------------------------
 * 常量字面值收口在 src/lib/site-config.mjs（唯一数据源，scripts/gen-feed.js /
 * gen-og-image.js 经 await import 共用同一份）；本文件只做 TS 侧派生（url 含
 * basePath 双态、mailto 链接）。修改身份信息只需改 site-config.mjs，全站自动同步。
 *
 * 注意：本模块会被客户端组件（Navbar/Footer 等）引用，
 * 因此不能加 'server-only' 导入，与 basePath.ts 相同。
 */
import { BASE_PATH } from './basePath';
import {
  SITE_NAME,
  SITE_BLOG_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_ORIGIN,
  SITE_GITHUB,
  SITE_EMAIL,
} from './site-config.mjs';

export const siteConfig = {
  /** 作者名（Navbar/Footer/首页 Hero 等显示用） */
  name: SITE_NAME,
  /** 站点名（openGraph siteName 等场景） */
  blogName: SITE_BLOG_NAME,
  /** 站点默认标题（浏览器标签页） */
  title: SITE_TITLE,
  /** 站点描述（metadata description / openGraph description） */
  description: SITE_DESCRIPTION,
  /**
   * 线上站点根地址（GitHub Pages）。
   *
   * ⚠️ 安全构建：BASE_PATH 由 next.config.ts 的 env.NEXT_PUBLIC_BASE_PATH 注入，
   * 在 SSR 和客户端 hydration 时值一致。dev 模式下为 ''，build 时为 '/sanshui-blog'。
   * 若 BASE_PATH 为空字符串以外的意外值（如 undefined），显式回退到裸路径，
   * 避免产出色散形如 'https://...undefined/sanshui-blog' 的损坏 URL。
   */
  url: `${SITE_ORIGIN}${BASE_PATH}`,
  /** GitHub 主页 */
  github: SITE_GITHUB,
  /** mailto 链接（调用方直接使用，无需再拼前缀） */
  emailHref: `mailto:${SITE_EMAIL}`,
  /**
   * 版权年份（固定常量）。
   * 不用 new Date().getFullYear()：客户端组件 SSR 用构建时年份、hydration 用访问时年份，
   * 跨年/跨时区会产生 hydration mismatch。每年元旦手动更新一次即可。
   */
  copyrightYear: 2026,
} as const;
