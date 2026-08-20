import 'server-only';
import fs from 'fs';
import path from 'path';
import { isPostFile, parsePostFile, sortPostsByDateDesc } from './parse-post.mjs';
import type { Post } from './types';

const postsDirectory = path.join(process.cwd(), 'content/posts');

/**
 * 模块级单次装载：解析一次、派生查询。
 * 静态导出下内容构建期不可变（AGENTS.md #18：修改文章需重新 build 才生效），
 * 因此去掉 mtime 签名缓存——每次算签名要 readdir + 逐文件 stat（2N 次 syscall），
 * 签名本身 O(N)，与缓存未命中成本同阶，只省了 gray-matter 解析。
 *
 * 三个懒加载索引，全部在首次查询时一次性构建（各自 O(N) 摊还）：
 *  - slugIndex：slug→Post，getPostBySlug 从 O(N) 线性扫描降为 O(1) 查找
 *  - tagIndex：tag→Post[]，getPostsByTag / getAllTags / getTagCounts 复用，
 *    避免「每个标签一次全量 filter」的 O(T×N) 累积开销（getTagCounts 单趟 O(N)）
 *  - orderIndex：slug→排序后下标，getAdjacentPosts 的 indexOf 从 O(N) 降为 O(1)
 * 文章数较少时差异可忽略，但这是零成本的正确优化。
 */
let loaded: Post[] | null = null;
let slugIndex: Map<string, Post> | null = null;
let tagIndex: Map<string, Post[]> | null = null;
let orderIndex: Map<string, number> | null = null;

function ensureIndex() {
  if (!slugIndex) {
    slugIndex = new Map();
    orderIndex = new Map();
    // 用 for-of + 计数器而非 forEach：回调是闭包，会把捕获的模块级 let 变量
    // 放宽回可空类型（TS18047），for-of 循环体不构成闭包，收窄保持有效
    let i = 0;
    for (const p of loaded!) {
      slugIndex.set(p.slug, p);
      orderIndex.set(p.slug, i);
      i++;
    }
  }
}

function ensureTagIndex() {
  if (!tagIndex) {
    tagIndex = new Map();
    for (const p of loaded!) {
      for (const t of p.tags) {
        const bucket = tagIndex.get(t);
        if (bucket) bucket.push(p);
        else tagIndex.set(t, [p]);
      }
    }
  }
}

function loadPosts(): Post[] {
  if (loaded) return loaded;
  loaded = fs
    .readdirSync(postsDirectory)
    .filter(isPostFile)
    .map(readPostFile)
    .sort(sortPostsByDateDesc);
  return loaded;
}

function readPostFile(fileName: string): Post {
  const filePath = path.join(postsDirectory, fileName);
  // 解析契约在 src/lib/parse-post.mjs（与 gen-posts-index.js 共享），避免两份实现漂移
  return parsePostFile(fileName, fs.readFileSync(filePath, 'utf-8'));
}

/** slug 统一在模块边界解码一次；非法编码（如孤立 %）按原样查找，自然未命中，不抛异常 */
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch (e) {
    // 只捕获 URIError：decodeURIComponent 对非法百分号编码抛出 URIError，
    // 其他异常（内存不足、递归溢出等）应向上抛，不应被静默吞掉
    if (e instanceof URIError) return slug;
    throw e;
  }
}

export function getAllPosts(): Post[] {
  return loadPosts();
}

export function getPostBySlug(slug: string): Post | undefined {
  loadPosts();
  ensureIndex();
  return slugIndex!.get(decodeSlug(slug));
}

export function getAllTags(): string[] {
  loadPosts();
  ensureTagIndex();
  return [...tagIndex!.keys()].sort();
}

/**
 * 单趟 O(N) 统计每个标签的文章数（构建 tagIndex 时顺带计数）。
 * 替代「getAllTags().map(t => getPostsByTag(t).length)」的 O(T×N) 嵌套循环
 * （归档页 / 标签总览页此前就是前者，标签多文章多时累积成本可观）。
 */
export function getTagCounts(): Map<string, number> {
  loadPosts();
  ensureTagIndex();
  const counts = new Map<string, number>();
  for (const [tag, posts] of tagIndex!) counts.set(tag, posts.length);
  return counts;
}

export function getPostsByTag(tag: string): Post[] {
  loadPosts();
  ensureTagIndex();
  return tagIndex!.get(tag) ?? [];
}

export function getAdjacentPosts(slug: string): { prev: Post | null; next: Post | null } {
  loadPosts();
  ensureIndex();
  // orderIndex 保存排序后下标，替代 posts.indexOf(target) 的 O(N) 线性扫描。
  const idx = orderIndex!.get(decodeSlug(slug));
  if (idx === undefined) return { prev: null, next: null };
  const posts = loaded!;
  return { prev: posts[idx + 1] ?? null, next: posts[idx - 1] ?? null };
}
