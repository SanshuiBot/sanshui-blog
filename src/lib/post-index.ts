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
import { calcReadingMinutes } from '@/lib/reading-minutes.mjs';

export interface PostIndexEntry {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  /**
   * 预计阅读分钟数 —— 由 gen-posts-index.js 构建期用 parse-post.mjs 的
   * calcReadingMinutes 算好写进索引，列表卡片直接读；详情页同一函数现算，
   * 两处同源同值（阅读时间公共化，不写死）。
   */
  readingMinutes?: number;
}

/** 文章详情路由统一构造（保留尾部斜杠，AGENTS.md #22；next/link 自动注入 basePath） */
export function postUrl(slug: string): string {
  return `/posts/${slug}/`;
}

/**
 * 从含这 5 字段的对象投影到 `PostIndexEntry`。
 *
 * 入参是 structural（不 import `Post`，保持本模块 client-safe）：
 * `Post` / `parsePostFile` 返回值都满足此结构。固化「content 不进索引」契约。
 * 入参带 `content` 时（服务端 RSC 调用：归档/标签/详情页透传完整 Post）
 * 用公共纯函数现算 readingMinutes，与 posts-index.json 同源同值——
 * 归档/标签页的卡片网格因此也能显示阅读时间。
 */
export function toIndexEntry<
  T extends { slug: string; title: string; date: string; excerpt: string; tags: string[] },
>(post: T & { content?: string }): PostIndexEntry {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    tags: post.tags,
    ...(post.content !== undefined ? { readingMinutes: calcReadingMinutes(post.content) } : {}),
  };
}
