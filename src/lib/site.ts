/**
 * 站点全局公共配置
 * -----------------------------
 * 作者名、站点 URL、GitHub 主页、联系邮箱等会在多个页面/组件中重复出现的值，
 * 统一收口在此处。修改身份信息只需改这里，全站自动同步，避免散落硬编码漏改。
 *
 * 注意：本模块会被客户端组件（Navbar/Footer 等）引用，
 * 因此不能加 'server-only' 导入，与 basePath.ts 相同。
 */
import { BASE_PATH } from './basePath';

export const siteConfig = {
  /** 作者名（Navbar/Footer/首页 Hero 等显示用） */
  name: '三水',
  /** 站点名（openGraph siteName 等场景） */
  blogName: '三水博客',
  /** 站点默认标题（浏览器标签页） */
  title: '三水 | 个人博客',
  /** 站点描述（metadata description / openGraph description） */
  description: '记录技术思考、生活感悟与创作灵感',
  /** 线上站点根地址（GitHub Pages）；由部署 basePath 派生，避免字面量重复 */
  url: `https://sanshuibot.github.io${BASE_PATH}`,
  /** GitHub 主页 */
  github: 'https://github.com/SanshuiBot',
  /** mailto 链接（调用方直接使用，无需再拼前缀） */
  emailHref: 'mailto:localhost6@foxmail.com',
  /**
   * 版权年份（固定常量）。
   * 不用 new Date().getFullYear()：客户端组件 SSR 用构建时年份、hydration 用访问时年份，
   * 跨年/跨时区会产生 hydration mismatch。每年元旦手动更新一次即可。
   */
  copyrightYear: 2026,
} as const;
