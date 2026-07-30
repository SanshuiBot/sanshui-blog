// 构建时通过 NEXT_PUBLIC_BASE_PATH 注入 basePath，保证 SSR 与客户端 hydration 一致。
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 把路由内部路径（如 /posts/xxx/）拼接成含 basePath 的公开路径。 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE_PATH}${path}`;
}

export { BASE_PATH };
