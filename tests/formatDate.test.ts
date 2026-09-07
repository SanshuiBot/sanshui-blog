import { describe, expect, it } from 'vitest';
import { formatDate } from '@/lib/formatDate';

describe('formatDate', () => {
  it('YYYY-MM-DD 走字符串切分快路径：时区无关，逐字等于 zh-CN long month 格式化', () => {
    // 修复契约：new Date('YYYY-MM-DD') 按 UTC 解析 + 本地时区格式化会让
    // UTC-7~-12 时区显示前一天并可能 hydration mismatch，此处锁定新行为
    expect(formatDate('2023-01-05')).toBe('2023年1月5日');
    expect(formatDate('2023-11-25')).toBe('2023年11月25日');
    expect(formatDate('2026-01-10')).toBe('2026年1月10日');
  });

  it('非 ISO 输入走 Date 回退：不抛异常，仍输出年月日形态', () => {
    // 12:00Z 在 UTC-12 ~ UTC+12 全部落在 1 月 5 日当天；用宽松断言覆盖边缘时区
    expect(formatDate('2023-01-05T12:00:00Z')).toMatch(/^2023年1月\d+日$/);
  });
});
