/**
 * 构建时 basePath 中心定义（SSR + 客户端 hydration 一致）。
 *
 * 关键点：`process.env.NEXT_BUILD` 没有 `NEXT_PUBLIC_` 前缀，
 * Next.js 不会把它 inline 到客户端 bundle，导致客户端 hydration 时
 * `BASE_PATH` 退化为 ''，`<Image src={withBase('/logo.svg')}>` 被解析成
 * `/logo.svg`（无前缀）→ 线上 404。
 *
 * 解决方案：用 `NEXT_PUBLIC_BASE_PATH` 环境变量，Next.js 会把它 inline
 * 到 SSR 和客户端 bundle 两边，保证 hydration 一致。
 *
 * - 构建时（NEXT_BUILD=1）：`next.config.ts` 设 basePath: '/sanshui-blog'，
 *   `NEXT_PUBLIC_BASE_PATH=/sanshui-blog` 同步注入
 * - dev 模式：basePath 为空字符串，所有 helper 退化为根路径
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 把路由内部路径（如 /posts/xxx/）拼接成含 basePath 的公开路径。 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE_PATH}${path}`;
}

export { BASE_PATH };
