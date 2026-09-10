/**
 * 站点常量唯一数据源（client-safe，纯常量无副作用）
 * -----------------------------
 * 消费方：
 *  - src/lib/site.ts（TS 直接 import，派生 url 等运行时字段）
 *  - scripts/gen-feed.js / gen-og-image.js（CJS，在 async 函数内 await import——
 *    与 parse-post.mjs 同一模式，脚本侧无法 require ESM）
 *
 * ⚠️ 改站点信息只改本文件，全站（页面/组件/feed/og 图）自动同步。
 *
 * ⚠️ 双端部署环境变量（2026-09 新增）：
 *  - GitHub Pages 端（deploy.yml / 本地 build）：不设环境变量，走下方默认值
 *    （origin = github.io、basePath = /sanshui-blog）。
 *  - Cloudflare Pages 端（面板构建设置）：设 `SITE_ORIGIN`（如
 *    https://sanshui-blog.pages.dev）与 `SITE_BASE_PATH=''`（CF 不支持子路径，
 *    必须根路径部署）——next.config.ts 的 BASE_PATH 与脚本侧 URL 自动同步。
 *  - ⚠️ 这两个字段只在「构建期 / 服务端 / 脚本」读取；若未来某客户端组件要
 *    渲染 siteConfig.url，需改走 NEXT_PUBLIC_ 注入（见 basePath.ts 的模式），
 *    否则客户端 bundle 中 process.env 内联后此处会回退默认值。
 */

/** 作者名（Navbar/Footer/首页 Hero 等显示用） */
export const SITE_NAME = '三水';

/** 站点名（openGraph siteName 等场景） */
export const SITE_BLOG_NAME = '三水博客';

/** 站点默认标题（浏览器标签页 / RSS channel title） */
export const SITE_TITLE = '三水 | 个人博客';

/** 站点描述（metadata / openGraph / feed description / og 图副标题） */
export const SITE_DESCRIPTION = '记录技术思考、生活感悟与创作灵感';

/** 线上站点 origin（不含 basePath）。双端部署：GitHub Pages 默认，CF 端由环境变量覆盖 */
export const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://sanshuibot.github.io';

/** 生产 basePath（仅脚本侧拼线上 URL 用；运行时以 basePath.ts 的双态值为准）。
 *  CF 端设 SITE_BASE_PATH='/'（CF 面板不允许空字符串值，用 '/' 标记根路径；
 *  空字符串 '' 同样兼容，归一化为无前缀）；GitHub Pages 端默认 /sanshui-blog */
export const SITE_BASE_PATH =
  process.env.SITE_BASE_PATH === '' || process.env.SITE_BASE_PATH === '/'
    ? ''
    : (process.env.SITE_BASE_PATH ?? '/sanshui-blog');

/** GitHub 主页 */
export const SITE_GITHUB = 'https://github.com/SanshuiBot';

/** 联系邮箱（裸地址；mailto 链接由 site.ts 派生） */
export const SITE_EMAIL = 'localhost6@foxmail.com';
