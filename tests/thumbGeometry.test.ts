import { describe, it, expect } from 'vitest';
import { thumbGeometry } from '@/lib/thumbGeometry';

describe('thumbGeometry', () => {
  it('内容不超出视口时返回 null（无需浮层）', () => {
    expect(thumbGeometry(400, 400, 0)).toBeNull();
    expect(thumbGeometry(400, 300, 0)).toBeNull();
  });

  it('按可滚比例计算 height，top 随滚动偏移', () => {
    expect(thumbGeometry(400, 1000, 0)).toEqual({ top: 0, height: 160 });
    expect(thumbGeometry(400, 1000, 600)).toEqual({ top: 240, height: 160 });
  });

  it('滚到底时 thumb 底边贴住视口底', () => {
    const g = thumbGeometry(200, 600, 400)!;
    expect(g.top + g.height).toBeCloseTo(200);
  });

  it('极小视口时 height 有 24px 下限', () => {
    const g = thumbGeometry(100, 10000, 0)!;
    expect(g.height).toBe(24);
    expect(g.top).toBe(0);
  });

  it('中间位置按比例插值', () => {
    const g = thumbGeometry(200, 600, 150)!;
    expect(g.height).toBeCloseTo(200 / 3);
    expect(g.top).toBeCloseTo(50);
  });
});
