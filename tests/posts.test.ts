import { describe, it, expect } from 'vitest';
import {
  getAllPosts,
  getPostBySlug,
  getPostsByTag,
  getAllTags,
  getAdjacentPosts,
} from '@/lib/posts';

describe('getAllPosts（真实 content/posts 契约）', () => {
  it('能读到文章且按日期降序排列', () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1]!.date >= posts[i]!.date).toBe(true);
    }
  });

  it('每篇文章的必填字段均合法', () => {
    for (const p of getAllPosts()) {
      expect(p.slug.length).toBeGreaterThan(0);
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.content.length).toBeGreaterThan(0);
      expect(Array.isArray(p.tags)).toBe(true);
    }
  });

  it('slug 全局唯一', () => {
    const posts = getAllPosts();
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
  });
});

describe('getPostBySlug', () => {
  it('按 slug 取回同一篇文章', () => {
    const first = getAllPosts()[0]!;
    expect(getPostBySlug(first.slug)?.title).toBe(first.title);
  });

  it('支持中文 slug（内部 decodeURIComponent）', () => {
    const cn = getAllPosts().find((p) => /[^\x00-\x7F]/.test(p.slug));
    expect(cn).toBeDefined();
    if (!cn) return;
    expect(getPostBySlug(cn.slug)?.slug).toBe(cn.slug);
    // URL 编码后的 slug 同样能命中
    expect(getPostBySlug(encodeURIComponent(cn.slug))?.slug).toBe(cn.slug);
  });

  it('未知 slug 返回 undefined', () => {
    expect(getPostBySlug('不存在的文章-xyz')).toBeUndefined();
  });
});

describe('getAdjacentPosts（按日期降序：prev 更旧 / next 更新）', () => {
  it('最新一篇 next 为 null，prev 为次新', () => {
    const posts = getAllPosts();
    const adj = getAdjacentPosts(posts[0]!.slug);
    expect(adj.next).toBeNull();
    expect(adj.prev?.slug).toBe(posts[1]?.slug);
  });

  it('最旧一篇 prev 为 null', () => {
    const posts = getAllPosts();
    const oldest = posts[posts.length - 1]!;
    expect(getAdjacentPosts(oldest.slug).prev).toBeNull();
  });

  it('中间文章的相邻关系与列表一致', () => {
    const posts = getAllPosts();
    for (let i = 1; i < posts.length - 1; i++) {
      const adj = getAdjacentPosts(posts[i]!.slug);
      expect(adj.prev?.slug).toBe(posts[i + 1]?.slug);
      expect(adj.next?.slug).toBe(posts[i - 1]?.slug);
    }
  });

  it('未知 slug 两边均为 null', () => {
    expect(getAdjacentPosts('not-exist')).toEqual({ prev: null, next: null });
  });
});

describe('getAllTags / getPostsByTag', () => {
  it('getAllTags 去重、排序且覆盖所有文章标签', () => {
    const tags = getAllTags();
    expect(tags).toEqual([...new Set(tags)].sort());
    const all = getAllPosts().flatMap((p) => p.tags);
    for (const t of all) expect(tags).toContain(t);
  });

  it('getPostsByTag 按标签筛选，未知标签返回空数组', () => {
    const tag = getAllTags()[0]!;
    const posts = getPostsByTag(tag);
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) expect(p.tags).toContain(tag);
    expect(getPostsByTag('__不存在的标签__')).toEqual([]);
  });
});
