import { describe, it, expect } from 'vitest';
import { isPostFile, parsePostFile, sortPostsByDateDesc } from '@/lib/parse-post.mjs';

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

  it('非法 date（不可解析的字符串）返回空串而非抛 RangeError', () => {
    // 注意：JS Date 对 2026-13-45 这类溢出值是宽松解析（进位成合法日期），
    // 只有真正不可解析的字符串才是 Invalid Date，无守卫时会抛 RangeError
    expect(() => parsePostFile('a.md', md('date: not-a-date'))).not.toThrow();
    expect(parsePostFile('a.md', md('date: not-a-date')).date).toBe('');
  });

  it('excerpt 缺省时剥离 markdown 结构并折叠空白（链接留锚文本、无换行残留）', () => {
    const body = '### 标题\n\n**加粗** 与 `代码` [链接](x) 尾部文本';
    const p = parsePostFile('a.md', md('date: 2026-01-01', body));
    expect(p.excerpt).toBe('标题 加粗 与 代码 链接 尾部文本');
  });

  it('excerpt 派生时移除围栏代码块与图片，只保留叙述文本', () => {
    const body = '导语一段\n\n```ts\nconst x = 1;\n```\n\n![图](a.png)\n收尾';
    const p = parsePostFile('a.md', md('date: 2026-01-01', body));
    expect(p.excerpt).toBe('导语一段 图 收尾');
  });

  it('excerpt 派生时吞掉未闭合围栏：语言名与代码到文末均不泄漏进摘要', () => {
    // 书写遗漏/截断导致围栏没有收尾 ```：旧正则只配对闭合，ts 语言名和代码会进摘要
    const body = '导语一段\n\n```ts\nconst secret = 1;\nconsole.log(secret);';
    const p = parsePostFile('a.md', md('date: 2026-01-01', body));
    expect(p.excerpt).toBe('导语一段');
  });

  it('tags 写成字符串时归一化为单元素数组，非数组/异常类型回退空数组', () => {
    expect(parsePostFile('a.md', md('tags: Go')).tags).toEqual(['Go']);
    // YAML 裸标量 123 解析为数字 → 字符串化后保留
    expect(parsePostFile('a.md', md('tags: 123')).tags).toEqual(['123']);
    // YAML flow mapping 解析为对象 → 既不是数组也不是字符串 → 空数组（不 spread 键名）
    expect(parsePostFile('a.md', md('tags: {a: 1}')).tags).toEqual([]);
  });

  it('updated 缺省时不含该键；合法时规整为 YYYY-MM-DD；非法时省略', () => {
    expect(parsePostFile('a.md', md('date: 2026-01-01')).updated).toBeUndefined();
    expect(parsePostFile('a.md', md('date: 2026-01-01\nupdated: 2026-02-03')).updated).toBe(
      '2026-02-03',
    );
    expect(parsePostFile('a.md', md('date: 2026-01-01\nupdated: nope')).updated).toBeUndefined();
  });

  it('显式 excerpt 优先于正文回退', () => {
    const p = parsePostFile('a.md', md('excerpt: 显式摘要\ntitle: T', '正文内容'));
    expect(p.excerpt).toBe('显式摘要');
  });

  it('支持 .mdx 扩展名', () => {
    expect(parsePostFile('a.mdx', md('title: T')).slug).toBe('a');
  });
});

describe('isPostFile / sortPostsByDateDesc（过滤与排序共享契约）', () => {
  it('isPostFile 只认 .md / .mdx', () => {
    expect(isPostFile('a.md')).toBe(true);
    expect(isPostFile('a.mdx')).toBe(true);
    expect(isPostFile('a.txt')).toBe(false);
  });

  it('sortPostsByDateDesc 按日期降序', () => {
    const posts = [{ date: '2026-01-01' }, { date: '2026-01-03' }, { date: '2026-01-02' }];
    expect([...posts].sort(sortPostsByDateDesc).map((p) => p.date)).toEqual([
      '2026-01-03',
      '2026-01-02',
      '2026-01-01',
    ]);
  });

  it('空/非法 date 排到最后且不产生 NaN 破坏排序', () => {
    const posts = [{ date: '' }, { date: '2026-01-01' }, { date: 'not-a-date' }];
    const sorted = [...posts].sort(sortPostsByDateDesc);
    // 两个无效日期都按 0 处理，稳定排序保持其原始相对顺序
    expect(sorted.map((p) => p.date)).toEqual(['2026-01-01', '', 'not-a-date']);
  });
});
