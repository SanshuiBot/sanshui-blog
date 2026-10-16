// @vitest-environment jsdom
/**
 * nav-history 纯函数契约测试 —— 文章页返回按钮的站内导航链。
 * -----------------------------
 * 覆盖（对应 BackButton 移动端两个历史故障的修复逻辑）：
 *  - syncNavHistory：追加/幂等/镜像截断（popstate 前进后退）/超长截尾；
 *  - resetNavHistory：全新进入或离开本站时重置；
 *  - getBackTarget：链尾校验防陈旧链误返（pre-hydration 脚本同规则）；
 *  - isStaticFilePathname：feed.xml 等静态文件 referrer 判定；
 *  - sessionStorage 不可用（隐私模式）静默降级为「无链 → 回首页」；
 *  - 脏数据（非 JSON/非数组/非字符串项）过滤。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NAV_HISTORY_KEY,
  getBackTarget,
  isStaticFilePathname,
  readNavHistory,
  resetNavHistory,
  syncNavHistory,
} from '@/lib/nav-history';

function setChain(chain: unknown): void {
  window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(chain));
}

function currentChain(): string[] {
  return JSON.parse(window.sessionStorage.getItem(NAV_HISTORY_KEY) ?? '[]') as string[];
}

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  // 还原被 length=1 用例遮蔽的 history.length（删实例属性，恢复原型 getter）
  delete (window.history as unknown as { length?: number }).length;
});

// jsdom 的 history.length 初值 1：getBackTarget 有 length>1 守卫（复制标签页
// 会复制 sessionStorage 但不复制历史栈），先推一条基线让用例聚焦链条逻辑
beforeEach(() => {
  if (window.history.length <= 1) window.history.pushState({}, '', '/');
});

describe('syncNavHistory', () => {
  it('空链 + 当前页 → [当前页]', () => {
    expect(syncNavHistory('/posts/a/')).toEqual(['/posts/a/']);
    expect(currentChain()).toEqual(['/posts/a/']);
  });

  it('软导航新页面 → 追加', () => {
    setChain(['/', '/archive/']);
    expect(syncNavHistory('/posts/a/')).toEqual(['/', '/archive/', '/posts/a/']);
  });

  it('与链尾相同（reload/重复挂载）→ 不动，幂等', () => {
    setChain(['/', '/posts/a/']);
    expect(syncNavHistory('/posts/a/')).toEqual(['/', '/posts/a/']);
    expect(currentChain()).toEqual(['/', '/posts/a/']);
  });

  it('链中更早位置（浏览器后退/前进回到旧条目）→ 镜像截断到该处', () => {
    setChain(['/', '/posts/a/', '/posts/b/']);
    // 从 /posts/b/ 后退到 /posts/a/：截断掉 b
    expect(syncNavHistory('/posts/a/')).toEqual(['/', '/posts/a/']);
  });

  it('超长会话 → 截尾保留最近 100 条', () => {
    const long = Array.from({ length: 120 }, (_, i) => `/p${i}/`);
    setChain(long);
    syncNavHistory('/posts/new/');
    const chain = currentChain();
    expect(chain).toHaveLength(100);
    expect(chain[chain.length - 1]).toBe('/posts/new/');
    expect(chain[0]).toBe('/p21/');
  });
});

describe('resetNavHistory', () => {
  it('重置为 [当前页]，丢弃旧链', () => {
    setChain(['/', '/archive/', '/posts/a/']);
    expect(resetNavHistory('/posts/b/')).toEqual(['/posts/b/']);
    expect(currentChain()).toEqual(['/posts/b/']);
  });
});

describe('getBackTarget', () => {
  it('链条 < 2 → null（无站内上一页，回首页）', () => {
    setChain(['/posts/a/']);
    expect(getBackTarget('/posts/a/')).toBeNull();
  });

  it('空链 → null', () => {
    expect(getBackTarget('/posts/a/')).toBeNull();
  });

  it('链尾是当前页 → 返回链尾前一项', () => {
    setChain(['/', '/archive/', '/posts/a/']);
    expect(getBackTarget('/posts/a/')).toBe('/archive/');
  });

  it('链尾不是当前页（陈旧链）→ null，防误返', () => {
    setChain(['/', '/posts/a/']);
    expect(getBackTarget('/posts/b/')).toBeNull();
  });

  it('history.length ≤ 1（链与历史栈背离，如复制标签页）→ null，放行回首页', () => {
    setChain(['/', '/posts/a/']);
    Object.defineProperty(window.history, 'length', { configurable: true, value: 1 });
    expect(getBackTarget('/posts/a/')).toBeNull();
  });
});

describe('isStaticFilePathname', () => {
  it('静态文件（末段带扩展名）→ true', () => {
    expect(isStaticFilePathname('/feed.xml')).toBe(true);
    expect(isStaticFilePathname('/sanshui-blog/og.png')).toBe(true);
    expect(isStaticFilePathname('/robots.txt')).toBe(true);
    expect(isStaticFilePathname('/favicon.ico')).toBe(true);
  });

  it('站内路由 → false', () => {
    expect(isStaticFilePathname('/')).toBe(false);
    expect(isStaticFilePathname('/posts/a/')).toBe(false);
    expect(isStaticFilePathname('/sanshui-blog/archive/')).toBe(false);
    expect(isStaticFilePathname('/tags/CSS/')).toBe(false);
  });
});

describe('脏数据与降级', () => {
  it('非 JSON 字符串 → 空链', () => {
    window.sessionStorage.setItem(NAV_HISTORY_KEY, 'not-json');
    expect(readNavHistory()).toEqual([]);
  });

  it('非数组 JSON → 空链', () => {
    setChain({ a: 1 });
    expect(readNavHistory()).toEqual([]);
  });

  it('数组内非字符串项被过滤', () => {
    setChain(['/', 42, null, '/posts/a/']);
    expect(readNavHistory()).toEqual(['/', '/posts/a/']);
  });

  it('sessionStorage 读抛错（隐私模式）→ 静默降级空链', () => {
    // 注意：jsdom 的 sessionStorage 是 Storage Proxy，spyOn(实例) 不生效，
    // 须 spy 原型方法（项目既有教训：实例 spy 会静默失效让测试假阳性）
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(readNavHistory()).toEqual([]);
    expect(getBackTarget('/posts/a/')).toBeNull();
    // sync/reset 不抛，返回计算值（写失败被吞）
    expect(syncNavHistory('/posts/a/')).toEqual(['/posts/a/']);
    expect(resetNavHistory('/posts/a/')).toEqual(['/posts/a/']);
  });

  it('sessionStorage 写抛错 → sync 不抛', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => syncNavHistory('/posts/a/')).not.toThrow();
  });
});
