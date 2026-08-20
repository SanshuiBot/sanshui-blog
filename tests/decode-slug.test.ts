import { describe, it, expect } from 'vitest';
import { getPostBySlug, getAdjacentPosts } from '@/lib/posts';

/**
 * decodeSlug 的 URIError 处理测试——验证非法编码不抛异常。
 * 原先 decodeSlug 的 catch 是裸 catch，现已改为只捕获 URIError。
 */
describe('decodeSlug（URIError 边界）', () => {
  it('非法百分号编码不抛异常（decodeURIComponent 抛出 URIError）', () => {
    // %E0%A4%A 是无效的 UTF-8 序列，decodeURIComponent 会抛 URIError
    expect(() => getPostBySlug('%E0%A4%A')).not.toThrow();
    expect(getPostBySlug('%E0%A4%A')).toBeUndefined();
  });

  it('合法编码正常解码', () => {
    // 'hello%20world' 解码为 'hello world'；content 中无此文章，
    // 应正常返回 undefined 而非抛异常（decode 成功但查无此 slug）
    expect(() => getPostBySlug('hello%20world')).not.toThrow();
    expect(getPostBySlug('hello%20world')).toBeUndefined();
  });

  it('getAdjacentPosts 对非法编码同样安全', () => {
    expect(() => getAdjacentPosts('%GG%')).not.toThrow();
    expect(getAdjacentPosts('%GG%')).toEqual({ prev: null, next: null });
  });
});
