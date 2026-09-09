/**
 * 站点常量唯一数据源（client-safe，纯常量无副作用）
 * -----------------------------
 * 消费方：
 *  - src/lib/site.ts（TS 直接 import，派生 url 等运行时字段）
 *  - scripts/gen-feed.js / gen-og-image.js（CJS，在 async 函数内 await import——
 *    与 parse-post.mjs 同一模式，脚本侧无法 require ESM）
 *
 * ⚠️ 改站点信息只改本文件，全站（页面/组件/feed/og 图）自动同步。
 * BASE_PATH 不在此处：它有 dev（无前缀）/ build（/sanshui-blog）双态，
 * 由 next.config.ts env 注入、basePath.ts 消费；脚本侧产出线上 URL 时
 * 用下方 SITE_BASE_PATH 拼接（脚本只跑在构建期，恒为生产值）。
 */

/** 作者名（Navbar/Footer/首页 Hero 等显示用） */
export const SITE_NAME = '三水';

/** 站点名（openGraph siteName 等场景） */
export const SITE_BLOG_NAME = '三水博客';

/** 站点默认标题（浏览器标签页 / RSS channel title） */
export const SITE_TITLE = '三水 | 个人博客';

/** 站点描述（metadata / openGraph / feed description / og 图副标题） */
export const SITE_DESCRIPTION = '记录技术思考、生活感悟与创作灵感';

/** 线上站点 origin（GitHub Pages，不含 basePath） */
export const SITE_ORIGIN = 'https://sanshuibot.github.io';

/** 生产 basePath（仅脚本侧拼线上 URL 用；运行时以 basePath.ts 的双态值为准） */
export const SITE_BASE_PATH = '/sanshui-blog';

/** GitHub 主页 */
export const SITE_GITHUB = 'https://github.com/SanshuiBot';

/** 联系邮箱（裸地址；mailto 链接由 site.ts 派生） */
export const SITE_EMAIL = 'localhost6@foxmail.com';
