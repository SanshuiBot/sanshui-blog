import { describe, expect, it } from 'vitest';
import { latestIsoDate, postModifiedDate } from '../src/lib/post-dates.mjs';

describe('post-dates 日期纯函数', () => {
  describe('latestIsoDate', () => {
    it('定宽 YYYY-MM-DD 按字典序取最新（与时间序一致）', () => {
      expect(latestIsoDate('2026-01-01', '2026-08-01', '2025-12-31')).toBe('2026-08-01');
    });

    it('忽略空串/undefined/null 等非字符串入参', () => {
      expect(latestIsoDate('', '2026-03-03', undefined)).toBe('2026-03-03');
      // 第二个位置为"缺省"（模拟 updated 缺省）也不影响
      expect(latestIsoDate('2026-03-03', '')).toBe('2026-03-03');
    });

    it('全部缺省返回空串（回退策略交给调用方）', () => {
      expect(latestIsoDate('', undefined)).toBe('');
      expect(latestIsoDate()).toBe('');
    });

    it('回归锁：不能用 Math.max 比较字符串（强转 NaN 曾致 feed lastBuildDate 倒退 epoch）', () => {
      // 若误用 Math.max，reduce 初始值 '' 与 NaN 比较恒 false，结果永远是 ''
      const posts = [
        { date: '2026-07-31', updated: undefined },
        { date: '2026-02-01', updated: '2026-09-15' },
      ];
      const latest = posts.reduce((acc, p) => latestIsoDate(acc, p.date, p.updated), '');
      expect(latest).toBe('2026-09-15');
    });
  });

  describe('postModifiedDate', () => {
    it('updated 缺省回退发布日期', () => {
      expect(postModifiedDate('2026-05-01', undefined)).toBe('2026-05-01');
      expect(postModifiedDate('2026-05-01', '')).toBe('2026-05-01');
    });

    it('updated 晚于 date 取 updated', () => {
      expect(postModifiedDate('2026-05-01', '2026-08-20')).toBe('2026-08-20');
    });

    it('updated 早于 date（脏 frontmatter）仍以 date 为准', () => {
      expect(postModifiedDate('2026-05-01', '2025-01-01')).toBe('2026-05-01');
    });

    it('两者都缺返回空串', () => {
      expect(postModifiedDate('', undefined)).toBe('');
    });
  });
});
