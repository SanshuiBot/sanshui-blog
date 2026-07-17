import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Post } from './types';

const postsDirectory = path.join(process.cwd(), 'content/posts');

function readPostFile(fileName: string): Post {
  const filePath = path.join(postsDirectory, fileName);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const slug = fileName.replace(/\.md$/, '');
  const title = data.title || slug;
  const date = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
  const excerpt =
    data.excerpt ||
    content
      .slice(0, 160)
      .replace(/[#*`\[\]]/g, '')
      .trim();
  const tags: string[] = data.tags || [];

  return { slug, title, date, excerpt, tags, content };
}

export function getAllPosts(): Post[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((fn) => fn.endsWith('.md'))
    .map(readPostFile)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  try {
    const fileName = fs.readdirSync(postsDirectory).find((fn) => fn.replace(/\.md$/, '') === slug);
    if (!fileName) return undefined;
    return readPostFile(fileName);
  } catch {
    return undefined;
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}
