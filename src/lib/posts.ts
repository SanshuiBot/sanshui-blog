import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Post } from './types';

const postsDirectory = path.join(process.cwd(), 'content/posts');

interface CacheEntry { posts: Post[]; signature: string; }

let cache: CacheEntry | null = null;

function computeSignature(): string {
  try {
    const names = fs.readdirSync(postsDirectory).filter((fn) => fn.endsWith('.md') || fn.endsWith('.mdx'));
    const mtimes = names.map((n) => {
      try { return fs.statSync(path.join(postsDirectory, n)).mtimeMs.toString(); } catch { return '0'; }
    });
    return names.map((n, i) => `${n}:${mtimes[i]}`).join('|');
  } catch { return ''; }
}

function readPostFile(fileName: string): Post {
  const filePath = path.join(postsDirectory, fileName);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  const slug = fileName.replace(/\.(mdx?)$/, '');
  const title: string = data.title ?? slug;
  const date: string = data.date ? new Date(data.date).toISOString().split('T')[0]! : '';
  const excerpt: string = data.excerpt ?? content.slice(0, 160).replace(/[#*`\[\]]/g, '').trim();
  const tags: string[] = data.tags ?? [];
  return { slug, title, date, excerpt, tags, content };
}

export function getAllPosts(): Post[] {
  const signature = computeSignature();
  if (cache && cache.signature === signature) return cache.posts;
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames.filter((fn) => fn.endsWith('.md') || fn.endsWith('.mdx')).map(readPostFile).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cache = { posts, signature };
  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  try { return getAllPosts().find((p) => p.slug === decodeURIComponent(slug)); } catch { return undefined; }
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  getAllPosts().forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}
