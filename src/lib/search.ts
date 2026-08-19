/**
 * 客户端搜索纯函数 —— SearchModal 的匹配/分词/高亮契约（可测试）。
 * -----------------------------
 * 与 Pagefind 是两套独立机制（AGENTS.md #14）；本模块是 ⌘K 搜索的
 * 匹配逻辑唯一实现，组件只负责渲染。纯函数、无 DOM、无 React 依赖：
 *  - tokenize：查询词按空白切分为小写词元（支持中文空格分词）
 *  - searchPosts：全词元 AND 匹配（title/excerpt/tags 拼成单个 haystack，
 *    每词只做一次 includes），替代原来的单串子串匹配
 *  - splitByTerms：把文本切成 命中/未命中 片段数组，供 <mark> 高亮渲染
 */
import type { PostIndexEntry } from './post-index';

/** 查询串 → 小写词元数组（去除空白与空词元） */
export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** 构造单篇索引条目的匹配 haystack（title/excerpt/tags 拼接） */
export function buildHaystack(post: PostIndexEntry): string {
  return [post.title, post.excerpt, ...post.tags].join('\n').toLowerCase();
}

/**
 * 按「全部词元 AND」过滤文章，最多返回 limit 条。
 * 空查询返回 []（不触发全量匹配）。
 */
export function searchPosts(
  entries: readonly PostIndexEntry[],
  query: string,
  limit = 8,
): PostIndexEntry[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const out: PostIndexEntry[] = [];
  for (const entry of entries) {
    const haystack = buildHaystack(entry);
    if (terms.every((t) => haystack.includes(t))) {
      out.push(entry);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export interface HighlightSegment {
  text: string;
  /** 该片段是否完整命中某个词元（用于 <mark> 高亮） */
  hit: boolean;
}

/** 文本按查询词元切分为高亮片段（大小写不敏感，原样保留大小写） */
export function splitByTerms(text: string, query: string): HighlightSegment[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [{ text, hit: false }];
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(re);
  const segs: HighlightSegment[] = [];
  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();
    segs.push({ text: part, hit: terms.some((t) => lower === t) });
  }
  return segs;
}
