import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  delete process.env.NEXT_PUBLIC_BASE_PATH;
});

/** BASE_PATH 在模块加载时读取环境变量，测试需 resetModules + 动态 import 重新求值。 */
async function loadBasePath() {
  vi.resetModules();
  return await import('@/lib/basePath');
}

describe('withBase / BASE_PATH', () => {
  it('未设置 NEXT_PUBLIC_BASE_PATH 时原样返回', async () => {
    const { withBase, BASE_PATH } = await loadBasePath();
    expect(BASE_PATH).toBe('');
    expect(withBase('/posts/abc/')).toBe('/posts/abc/');
  });

  it('设置后拼接 basePath 前缀', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/sanshui-blog';
    const { withBase, BASE_PATH } = await loadBasePath();
    expect(BASE_PATH).toBe('/sanshui-blog');
    expect(withBase('/posts/abc/')).toBe('/sanshui-blog/posts/abc/');
  });

  it('非 / 开头的路径不拼接（相对路径/空串）', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/sanshui-blog';
    const { withBase } = await loadBasePath();
    expect(withBase('relative/path')).toBe('relative/path');
    expect(withBase('')).toBe('');
  });
});
