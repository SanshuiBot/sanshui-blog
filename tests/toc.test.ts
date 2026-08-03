import { describe, it, expect } from 'vitest';
import { extractHeadings } from '@/lib/toc';

describe('extractHeadings', () => {
  it('extracts ## headings at level 2', () => {
    const items = extractHeadings('## 章节标题');
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ id: '章节标题', text: '章节标题', level: 2 });
  });

  it('extracts ### headings at level 3', () => {
    const items = extractHeadings('### 小节');
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ id: '小节', text: '小节', level: 3 });
  });

  it('ignores # h1 and #### h4 headings', () => {
    const items = extractHeadings('# 大标题\n\n## 真标题\n\n#### 不入目录');
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ id: '真标题', text: '真标题', level: 2 });
  });

  it('preserves heading order across levels', () => {
    const items = extractHeadings('### a\n## b\n### c');
    expect(items.map((i) => i.text)).toEqual(['a', 'b', 'c']);
    expect(items.map((i) => i.level)).toEqual([3, 2, 3]);
  });

  it('keeps Chinese characters in the id', () => {
    const items = extractHeadings('## React 并发渲染机制');
    expect(items[0]!.id).toBe('react-并发渲染机制');
  });

  it('lowercases Latin text and turns spaces into hyphens', () => {
    const items = extractHeadings('## Hello, World! (2026)');
    expect(items[0]!.id).toBe('hello-world-2026');
  });

  it('strips inline HTML from the id but keeps it in text', () => {
    const items = extractHeadings('## Install <code>npm</code>');
    expect(items[0]!.text).toBe('Install <code>npm</code>');
    expect(items[0]!.id).toBe('install-npm');
  });

  it('collapses repeated hyphens and trims edge hyphens', () => {
    expect(extractHeadings('## A--B')[0]!.id).toBe('a-b');
    expect(extractHeadings('## -Title-')[0]!.id).toBe('title');
  });

  it('returns an empty array when there are no headings', () => {
    expect(extractHeadings('只有正文，没有标题。\n\n普通段落。')).toEqual([]);
  });
});
