import { describe, it, expect } from 'vitest';
import { parsePostFile } from '@/lib/parse-post.mjs';

const md = (fm: string, body = '正文') => `---\n${fm}\n---\n${body}`;

describe('parsePostFile（posts.ts 与 gen-posts-index.js 的共享解析契约）', () => {
  it('提取 frontmatter 字段并按文件名生成 slug', () => {
    const p = parsePostFile(
      '深入理解-react-19.md',
      md('title: React 19\ndate: 2026-01-15\ntags: [React, 前端]'),
    );
    expect(p.slug).toBe('深入理解-react-19');
    expect(p.title).toBe('React 19');
    expect(p.date).toBe('2026-01-15');
    expect(p.tags).toEqual(['React', '前端']);
    expect(p.content).toContain('正文');
  });

  it('缺 title 时回退为 slug，缺 tags 时为空数组', () => {
    const p = parsePostFile('a.md', md('date: 2026-01-01'));
    expect(p.title).toBe('a');
    expect(p.tags).toEqual([]);
  });

  it('缺 date 时为空字符串', () => {
    expect(parsePostFile('a.md', md('title: T')).date).toBe('');
  });

  it('excerpt 缺省时取正文前 160 字并剥掉 markdown 符号', () => {
    const body = '### 标题\n\n**加粗** 与 `代码` [链接](x) 尾部文本';
    const p = parsePostFile('a.md', md('date: 2026-01-01', body));
    expect(p.excerpt).toBe('标题\n\n加粗 与 代码 链接(x) 尾部文本');
  });

  it('显式 excerpt 优先于正文回退', () => {
    const p = parsePostFile('a.md', md('excerpt: 显式摘要\ntitle: T', '正文内容'));
    expect(p.excerpt).toBe('显式摘要');
  });

  it('支持 .mdx 扩展名', () => {
    expect(parsePostFile('a.mdx', md('title: T')).slug).toBe('a');
  });
});
