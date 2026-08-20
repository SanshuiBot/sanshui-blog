/**
 * 文章索引共享缓存 —— SearchModal / PostsList / HeroParallax 共用同一份 posts-index.json 数据。
 * -----------------------------
 * 三处各自独立 fetch 会浪费带宽且导致首屏数据到达时间不一致。
 * 本模块提供模块级 Promise 缓存，首次 fetch 后所有调用方共享同一 Promise（而非数据），
 * 保证并发调用时只发一次网络请求，后续调用直接拿到结果。
 *
 * 取消机制：fetch 失败时缓存置空，下次打开会重新尝试（不永久缓存错误）。
 */
import { withBase } from './basePath';
import type { PostIndexEntry } from './post-index';

let fetchPromise: Promise<PostIndexEntry[]> | null = null;

/**
 * 获取文章索引（带模块级 Promise 缓存）。
 * - 首次调用：发起 fetch，缓存 Promise
 * - 重复调用：返回缓存的 Promise（同一网络请求共享）
 * - 失败后：缓存清空，下次调用重新 fetch
 */
export function getPostsIndex(): Promise<PostIndexEntry[]> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch(withBase('/posts-index.json'))
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .catch((err: unknown) => {
      // 失败时清空缓存，避免永久 cache 错误状态
      fetchPromise = null;
      throw err;
    }) as Promise<PostIndexEntry[]>;
  return fetchPromise;
}
