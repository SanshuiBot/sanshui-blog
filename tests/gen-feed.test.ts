import { describe, expect, it } from 'vitest';
import {
  cdata,
  esc,
  plainExcerpt,
  rfc822,
  hasFullContent,
  FULL_CONTENT_LIMIT,
} from '../scripts/gen-feed.js';

describe('gen-feed 纯函数契约', () => {
  it('cdata：普通文本原样包裹', () => {
    expect(cdata('hello')).toBe('<![CDATA[hello]]>');
  });

  it('cdata：正文含 ]]> 时拆分为两个 CDATA 段，解析回原文（防畸形 XML）', () => {
    const xml = `<root>${cdata('a]]>b')}</root>`;
    const re = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
    let m: RegExpExecArray | null;
    let out = '';
    while ((m = re.exec(xml)) !== null) out += m[1] ?? '';
    expect(out).toBe('a]]>b');
  });

  it('esc：XML 五实体转义', () => {
    expect(esc(`a&b<c>"d'`)).toBe('a&amp;b&lt;c&gt;&quot;d&apos;');
  });

  it('plainExcerpt：无 excerpt 时去 markdown 记号取前 160 字', () => {
    expect(plainExcerpt('## title\n```js\ncode\n```', '')).toContain('title');
    expect(plainExcerpt('ignored', '已有 excerpt')).toBe('已有 excerpt');
  });

  it('rfc822：合法日期转 RFC822，非法回退固定 epoch（避免 git 噪音）', () => {
    expect(rfc822('2026-01-10')).toBe('Sat, 10 Jan 2026 00:00:00 GMT');
    expect(rfc822('not-a-date')).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('全文截断契约：仅最新 FULL_CONTENT_LIMIT 篇含全文', () => {
    expect(FULL_CONTENT_LIMIT).toBe(10);
    expect(hasFullContent(0)).toBe(true);
    expect(hasFullContent(9)).toBe(true);
    expect(hasFullContent(10)).toBe(false);
    expect(hasFullContent(99)).toBe(false);
  });
});
