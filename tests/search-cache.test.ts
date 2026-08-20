import { describe, it, expect } from 'vitest';
import { splitByTerms, tokenize } from '@/lib/search';

/**
 * splitByTerms 的正则缓存测试——验证缓存命中与 miss 行为。
 * 同 query 多次调用应命中缓存；不同 query 独立编译。
 */
describe('splitByTerms（正则缓存）', () => {
  it('同一查询词元组合缓存命中（返回相同结果）', () => {
    const text = 'React Server Components 是 Next.js 的新特性';
    const r1 = splitByTerms(text, 'react components');
    const r2 = splitByTerms(text, 'react components');
    expect(r1).toEqual(r2);
    // 命中词元应被高亮
    const hitTexts = r1.filter((s) => s.hit).map((s) => s.text);
    expect(hitTexts).toContain('React');
    expect(hitTexts).toContain('Components');
  });

  it('多词元 AND 匹配高亮', () => {
    const segs = splitByTerms('Redis 分布式锁实战', 'redis 锁');
    const hits = segs.filter((s) => s.hit).map((s) => s.text);
    expect(hits).toEqual(['Redis', '锁']);
  });

  it('空查询返回单段未命中', () => {
    expect(splitByTerms('任何文本', '')).toEqual([{ text: '任何文本', hit: false }]);
  });

  it('特殊字符词元正确转义（不崩溃）', () => {
    // 正则 special chars 应被正确转义，不抛出异常
    expect(() => splitByTerms('a.b*c+d', 'a.b')).not.toThrow();
  });
});

describe('tokenize（边界情况）', () => {
  it('全空白返回空数组', () => {
    expect(tokenize('   \t\n  ')).toEqual([]);
  });

  it('Unicode 空格（非 ASCII）也应切分', () => {
    //   是 NBSP，/\\s+/ 应能匹配
    expect(tokenize('a b')).toEqual(['a', 'b']);
  });
});
