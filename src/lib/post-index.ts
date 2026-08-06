/**
 * 文章索引条目 —— SearchModal 运行时 fetch 的轻量索引形状（client-safe）。
 *
 * 与 `src/lib/types.ts` 的 `Post` 相同字段但剔除 `content` / `readingTime?`——
 * 前者让 `posts-index.json` 从 ~72KB 涨到全量数据被序列化进 RSC payload，
 * 此处只保留 SearchModal 需要的 5 字段（~10KB）。
 *
 * **不 import `Post`**（types.ts 顶 `import 'server-only'`，client 不能 import）；
 * `PostIndexEntry` 是 client-safe 的独立 interface。字段集与 `scripts/gen-posts-index.js`
 * L33 的字段选取字面一致——未来字段变更改两处（此处 + 脚本）。
 * 见 ADR-0004。
 */
export interface PostIndexEntry {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
}

/**
 * 从含这 5 字段的对象投影到 `PostIndexEntry`。
 *
 * 入参是 structural（不 import `Post`，保持本模块 client-safe）：
 * `Post` / `parsePostFile` 返回值都满足此结构。固化「content 不进索引」契约。
 */
export function toIndexEntry<
  T extends { slug: string; title: string; date: string; excerpt: string; tags: string[] },
>(post: T): PostIndexEntry {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    tags: post.tags,
  };
}
