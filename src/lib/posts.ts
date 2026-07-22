import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Post } from "./types";

const postsDirectory = path.join(process.cwd(), "content/posts");

interface CacheEntry { posts: Post[]; signature: string }
let cache: CacheEntry | null = null;

function computeSignature(): string {
  try {
    const names = fs.readdirSync(postsDirectory).filter((fn) => fn.endsWith(".md") || fn.endsWith(".mdx"));
    const mtimes = names.map((n) => { try { return fs.statSync(path.join(postsDirectory, n)).mtimeMs.toString() } catch { return "0" } });
    return names.map((n, i) => `${n}:${mtimes[i]}`).join("|");
  } catch { return "" }
}

function readPostFile(fileName: string): Post {
  const filePath = path.join(postsDirectory, fileName);
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  const slug = fileName.replace(/\.(mdx?)$/, "");
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ? new Date(data.date).toISOString().split("T")[0]! : "",
    excerpt: data.excerpt ?? content.slice(0, 160).replace(/[#*`\[\]]/g, "").trim(),
    tags: data.tags ?? [],
    content,
  };
}

export function getAllPosts(): Post[] {
  const sig = computeSignature();
  if (cache && cache.signature === sig) return cache.posts;
  const posts = fs.readdirSync(postsDirectory).filter((fn) => fn.endsWith(".md") || fn.endsWith(".mdx")).map(readPostFile).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cache = { posts, signature: sig };
  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  try { return getAllPosts().find((p) => p.slug === decodeURIComponent(slug)) } catch { return undefined }
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  getAllPosts().forEach((p) => p.tags.forEach((t) => set.add(t)));
  return [...set].sort();
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}
export function getAdjacentPosts(slug: string): { prev: Post | null; next: Post | null } {
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.slug === decodeURIComponent(slug));
  if (idx === -1) return { prev: null, next: null };
  return { prev: posts[idx + 1] ?? null, next: posts[idx - 1] ?? null };
}