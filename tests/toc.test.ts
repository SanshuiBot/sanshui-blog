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

  it('ignores # h1 and #### h4 headings (but h1/h4 仍推进 slugger 状态)', () => {
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

  it('与渲染侧 github-slugger 一致：保留重音拉丁与日文假名', () => {
    expect(extractHeadings('## Résumé')[0]!.id).toBe('résumé');
    expect(extractHeadings('## 日本語のタイトル')[0]!.id).toBe('日本語のタイトル');
  });

  it('与渲染侧 github-slugger 一致：不去重连字符、不去边缘连字符', () => {
    expect(extractHeadings('## A--B')[0]!.id).toBe('a--b');
    expect(extractHeadings('## -Title-')[0]!.id).toBe('-title-');
  });

  it('strips inline HTML from the id but keeps it in text', () => {
    const items = extractHeadings('## Install <code>npm</code>');
    expect(items[0]!.text).toBe('Install <code>npm</code>');
    expect(items[0]!.id).toBe('install-npm');
  });

  it('重复标题获得 -1/-2 后缀（与渲染侧同一 slugger 实例语义）', () => {
    const ids = extractHeadings('## 同标题\n## 同标题\n## 同标题').map((i) => i.id);
    expect(ids).toEqual(['同标题', '同标题-1', '同标题-2']);
  });

  it('h1 与 h2 重名时 h2 让位（slugger 状态按文档顺序推进）', () => {
    const items = extractHeadings('# 同标题\n## 同标题');
    expect(items[0]!.id).toBe('同标题-1');
  });

  it('跳过代码围栏内的假标题，避免失效锚点', () => {
    const items = extractHeadings('```md\n## 围栏里的假标题\n```\n\n## 真标题');
    expect(items.map((i) => i.text)).toEqual(['真标题']);
  });

  it('returns an empty array when there are no headings', () => {
    expect(extractHeadings('只有正文，没有标题。\n\n普通段落。')).toEqual([]);
  });
});
