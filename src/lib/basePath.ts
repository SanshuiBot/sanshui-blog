/**
 * 构建时 basePath 中心定义。
 *
 * `next.config.ts` 在 NEXT_BUILD=1 时设 basePath: '/sanshui-blog',
 * 但 Next 不会把这个值注入到运行时——客户端组件拿不到，
 * 必须在源码里手动拼接。
 *
 * dev 模式下 NEXT_BUILD 未设，basePath 为空字符串,
 * 此时所有 helper 路径退化为根路径,与 Next dev 行为一致。
 */
const BASE_PATH = process.env.NEXT_BUILD === '1' ? '/sanshui-blog' : '';

/** 把路由内部路径（如 /posts/xxx/）拼接成含 basePath 的公开路径。 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE_PATH}${path}`;
}

export { BASE_PATH };
