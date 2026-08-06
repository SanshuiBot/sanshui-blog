import { describe, it, expect } from 'vitest';
import { toIndexEntry, type PostIndexEntry } from '@/lib/post-index';

/**
 * 契约测试（ADR-0004）：
 *  - toIndexEntry 投影出 5 字段（slug/title/date/excerpt/tags）
 *  - content / readingTime 不进索引（固化「索引剔除 content」契约）
 *  - 入参是 structural，含这 5 字段的任何对象都能投影
 */
describe('toIndexEntry', () => {
  it('投影出 5 字段（slug/title/date/excerpt/tags）', () => {
    const entry = toIndexEntry({
      slug: 'react-19',
      title: 'React 19',
      date: '2026-01-01',
      excerpt: '并发渲染机制',
      tags: ['Next.js', '前端'],
    });
    expect(entry).toEqual({
      slug: 'react-19',
      title: 'React 19',
      date: '2026-01-01',
      excerpt: '并发渲染机制',
      tags: ['Next.js', '前端'],
    });
  });

  it('content / readingTime 不进索引（剔除契约）', () => {
    // 含 content + readingTime 的完整 Post 形状
    const entry = toIndexEntry({
      slug: 'react-19',
      title: 'React 19',
      date: '2026-01-01',
      excerpt: '并发渲染机制',
      tags: ['Next.js'],
      content: '完整正文……',
      readingTime: 5,
    });
    expect(entry).not.toHaveProperty('content');
    expect(entry).not.toHaveProperty('readingTime');
    // 5 字段齐全
    expect(Object.keys(entry).sort()).toEqual(['date', 'excerpt', 'slug', 'tags', 'title'].sort());
  });

  it('返回值满足 PostIndexEntry 接口（类型契约）', () => {
    const entry: PostIndexEntry = toIndexEntry({
      slug: 'a',
      title: 'A',
      date: '2026-01-01',
      excerpt: '',
      tags: [],
    });
    // 编译期已保证形状；运行时再验字段类型
    expect(typeof entry.slug).toBe('string');
    expect(typeof entry.title).toBe('string');
    expect(typeof entry.date).toBe('string');
    expect(typeof entry.excerpt).toBe('string');
    expect(Array.isArray(entry.tags)).toBe(true);
  });

  it('入参是 structural——parsePostFile 返回形状也能投影', () => {
    // parsePostFile 返回 { slug, title, date, excerpt, tags, content }，
    // 满足 toIndexEntry 的 structural 入参（无需 import parsePostFile）
    const parsed = {
      slug: 'r',
      title: 'R',
      date: '2026-01-01',
      excerpt: 'x',
      tags: ['t'],
      content: '正文',
    };
    const entry = toIndexEntry(parsed);
    expect(entry.slug).toBe('r');
    expect(entry).not.toHaveProperty('content');
  });
});
