import { describe, it, expect } from 'vitest';
import { getResumeMarkdown } from '@/lib/resume';
import { splitResumeLines } from '@/lib/resumeLines';

describe('splitResumeLines', () => {
  it('按换行切分普通文本', () => {
    expect(splitResumeLines('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('将 CRLF 归一化为 LF', () => {
    expect(splitResumeLines('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
  });

  it('保留空行（作为打印节奏间隔）', () => {
    expect(splitResumeLines('a\n\nb')).toEqual(['a', '', 'b']);
  });

  it('去掉末尾换行符产生的尾部空串（避免最后一行后残留空行）', () => {
    expect(splitResumeLines('a\nb\nc\n')).toEqual(['a', 'b', 'c']);
    expect(splitResumeLines('a\n\nb\n\n')).toEqual(['a', '', 'b']);
    expect(splitResumeLines('a\r\nb\r\n')).toEqual(['a', 'b']);
  });

  it('单行输入返回单元素数组', () => {
    expect(splitResumeLines('只有一行')).toEqual(['只有一行']);
  });
});

describe('getResumeMarkdown（真实 content/resume.md）', () => {
  it('能读取到非空简历内容', () => {
    const md = getResumeMarkdown();
    expect(typeof md).toBe('string');
    expect(md.length).toBeGreaterThan(0);
  });

  it('内容包含 markdown 标题（终端打印依赖 #/##/###）', () => {
    expect(getResumeMarkdown()).toMatch(/^#{1,3}\s/m);
  });

  it('切分结果不含回车符（CRLF 已归一化）', () => {
    const lines = splitResumeLines(getResumeMarkdown());
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line).not.toContain('\r');
  });
});
