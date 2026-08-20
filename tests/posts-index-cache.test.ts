import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * posts-index-cache 的测试策略：
 * - getPostsIndex 走 fetch 网络请求，而 node 环境的 fetch（undici）不接受相对 URL
 *   （浏览器才支持，会抛 "Failed to parse URL"），所以统一用 vi.stubGlobal mock fetch，
 *   验证：
 *   1. 模块级缓存语义（多次调用返回同一 Promise 引用）
 *   2. resolve 后缓存持久（不因成功而重置）
 *   3. fetch 失败后缓存清除，下次调用重新请求（不永久缓存错误）
 * - 模块级缓存跨测试残留，每个用例前 vi.resetModules() + 动态 import 拿全新模块。
 */
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('getPostsIndex（共享缓存 Promise）', () => {
  it('连续调用返回同一 Promise 引用（模块级缓存生效）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    const { getPostsIndex } = await import('@/lib/posts-index-cache');

    const p1 = getPostsIndex();
    expect(p1).toBeInstanceOf(Promise);
    // 第二次调用应返回同一个 Promise（缓存命中）
    const p2 = getPostsIndex();
    expect(p2).toBe(p1);
  });

  it('resolve 后再次调用仍返回同一 Promise（缓存持久到下次失败）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    const { getPostsIndex } = await import('@/lib/posts-index-cache');

    const p1 = getPostsIndex();
    const p2 = getPostsIndex();
    expect(p2).toBe(p1);
    // 等待 resolve，验证成功结果也缓存
    await expect(p1).resolves.toEqual([]);
    const p3 = getPostsIndex();
    expect(p3).toBe(p1);
  });

  it('fetch 失败后缓存清除，下次调用重新请求（不永久缓存错误）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('oops', 500)));
    const { getPostsIndex } = await import('@/lib/posts-index-cache');

    // 首次请求失败：reject 状态码
    await expect(getPostsIndex()).rejects.toBe(500);
    // 缓存已清空：换成成功响应，应发起新请求并 resolve
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    await expect(getPostsIndex()).resolves.toEqual([]);
  });
});
