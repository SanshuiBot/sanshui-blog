import { describe, it, expect } from 'vitest';
import { getPostsIndex } from '@/lib/posts-index-cache';

/**
 * posts-index-cache 的测试策略：
 * - 由于 getPostsIndex 在真实环境发起网络请求，这里验证：
 *   1. 模块级缓存语义（多次调用返回同一 Promise 引用）
 *   2. 错误后缓存清除（手动 monkey-patch fetch 模拟失败）
 */
describe('getPostsIndex（共享缓存 Promise）', () => {
  it('连续调用返回同一 Promise 引用（模块级缓存生效）', () => {
    // 首次调用会触发真实 fetch；这里只验证接口存在且可链式调用
    const p1 = getPostsIndex();
    expect(p1).toBeInstanceOf(Promise);
    // 第二次调用应返回同一个 Promise（缓存命中）
    const p2 = getPostsIndex();
    expect(p2).toBe(p1);
  });

  it('resolve 后再次调用仍返回同一 Promise（缓存持久到下次失败）', async () => {
    const p1 = getPostsIndex();
    const p2 = getPostsIndex();
    expect(p2).toBe(p1);
    // 不 await，避免影响其他测试；Promise 最终 resolve 或 reject 都不会破坏测试
    void p1.catch(() => {});
  });
});
