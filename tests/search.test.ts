import { describe, expect, it } from 'vitest';
import { tokenize, searchPosts, splitByTerms, type HighlightSegment } from '@/lib/search';
import type { PostIndexEntry } from '@/lib/post-index';

const entries: PostIndexEntry[] = [
  {
    slug: 'react-server-components-实战与踩坑',
    title: 'React Server Components 实战与踩坑',
    date: '2026-01-10',
    excerpt: 'RSC 在服务端与客户端的边界实践，缓存与流式渲染踩坑记录',
    tags: ['React', 'Next.js'],
  },
  {
    slug: 'tailwind-v4-迁移实战',
    title: 'Tailwind CSS v4 迁移实战',
    date: '2026-02-01',
    excerpt: 'CSS-first 配置迁移、@theme 变量与亮暗主题的完整流程',
    tags: ['CSS', 'Tailwind'],
  },
  {
    slug: 'redis-分布式锁实战',
    title: 'Redis 分布式锁实战',
    date: '2026-03-05',
    excerpt: 'SETNX 与 Redisson 两种实现对比',
    tags: ['Redis', '分布式'],
  },
];

describe('tokenize', () => {
  it('按空白切分并转小写', () => {
    expect(tokenize('React RSC')).toEqual(['react', 'rsc']);
  });
  it('去除多余空白与空词元', () => {
    expect(tokenize('  redis   锁  ')).toEqual(['redis', '锁']);
  });
  it('空串/纯空白返回空数组', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });
  it('中文与英文混合正常', () => {
    expect(tokenize('Tailwind v4 迁移')).toEqual(['tailwind', 'v4', '迁移']);
  });
});

describe('searchPosts', () => {
  it('空查询不匹配任何文章', () => {
    expect(searchPosts(entries, '')).toEqual([]);
    expect(searchPosts(entries, '   ')).toEqual([]);
  });
  it('单关键词子串匹配（大小写不敏感）', () => {
    expect(searchPosts(entries, 'react').map((p) => p.slug)).toEqual([
      'react-server-components-实战与踩坑',
    ]);
    expect(searchPosts(entries, 'TAILWIND').map((p) => p.slug)).toEqual(['tailwind-v4-迁移实战']);
  });
  it('多关键词空格 AND：全词元都命中才算', () => {
    expect(searchPosts(entries, 'react 实战').map((p) => p.slug)).toEqual([
      'react-server-components-实战与踩坑',
    ]);
    // 第二个词元不命中 → 空
    expect(searchPosts(entries, 'react 锁')).toEqual([]);
  });
  it('中文分词：跨字段（title/excerpt/tags）都能命中', () => {
    // tags 命中
    expect(searchPosts(entries, 'redis 锁').map((p) => p.slug)).toEqual(['redis-分布式锁实战']);
    // excerpt 命中
    expect(searchPosts(entries, 'redisson').map((p) => p.slug)).toEqual(['redis-分布式锁实战']);
    // title 命中
    expect(searchPosts(entries, '迁移 实战').map((p) => p.slug)).toEqual(['tailwind-v4-迁移实战']);
  });
  it('limit 截断结果数量', () => {
    const many: PostIndexEntry[] = [
      ...entries,
      ...entries.map((e) => ({ ...e, slug: e.slug + '-2', title: e.title + '（二）' })),
    ];
    expect(searchPosts(many, '实战', 3).length).toBe(3);
  });
});

describe('splitByTerms', () => {
  it('空查询返回单段未命中', () => {
    expect(splitByTerms('Redis 分布式锁', '')).toEqual([{ text: 'Redis 分布式锁', hit: false }]);
  });
  it('命中词元切分为 hit 片段（大小写不敏感）', () => {
    const segs = splitByTerms('React Server Components', 'react');
    expect(segs).toEqual([
      { text: 'React', hit: true },
      { text: ' Server Components', hit: false },
    ]);
  });
  it('多词元分别高亮', () => {
    const segs = splitByTerms('Redis 分布式锁实战', 'redis 锁');
    const hits = segs.filter((s: HighlightSegment) => s.hit).map((s: HighlightSegment) => s.text);
    expect(hits).toEqual(['Redis', '锁']);
  });
  it('拼回原文（不丢字符）', () => {
    const text = 'Tailwind CSS v4 迁移实战';
    const joined = splitByTerms(text, 'tailwind 迁移')
      .map((s: HighlightSegment) => s.text)
      .join('');
    expect(joined).toBe(text);
  });
});
