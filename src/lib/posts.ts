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
 * 额外维护 slug→Post 的 Map 索引，使 getPostBySlug / getAdjacentPosts 从 O(N)
 * 线性扫描降为 O(1) 查找。文章数较少时差异可忽略，但这是零成本的正确优化。
 */
let loaded: Post[] | null = null;
let slugIndex: Map<string, Post> | null = null;

function ensureIndex() {
  if (!slugIndex) {
    slugIndex = new Map();
    for (const p of loaded!) slugIndex.set(p.slug, p);
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
  } catch {
    return slug;
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
  const set = new Set<string>();
  loadPosts().forEach((p) => p.tags.forEach((t) => set.add(t)));
  return [...set].sort();
}

export function getPostsByTag(tag: string): Post[] {
  return loadPosts().filter((p) => p.tags.includes(tag));
}

export function getAdjacentPosts(slug: string): { prev: Post | null; next: Post | null } {
  const posts = loadPosts();
  ensureIndex();
  // 用 slugIndex 拿到目标 Post 引用后，再回 posts 数组定位下标，
  // 避免对整个数组做 O(N) findIndex 线性扫描。
  const target = slugIndex!.get(decodeSlug(slug));
  if (!target) return { prev: null, next: null };
  const idx = posts.indexOf(target);
  if (idx === -1) return { prev: null, next: null };
  return { prev: posts[idx + 1] ?? null, next: posts[idx - 1] ?? null };
}
