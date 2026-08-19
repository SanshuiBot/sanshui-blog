// @vitest-environment jsdom
/**
 * SearchModal 组件级测试 —— 键盘导航与渲染契约。
 * -----------------------------
 * 项目常规测试是 node 环境纯函数；本文件用 jsdom + Testing Library 覆盖
 * 组件交互（多关键词过滤、键盘选择 + Enter 跳转、无结果态、Escape 关闭）。
 * 依赖 mock：next/link → 纯 <a>，next/navigation → 可控 router；fetch → posts-index 桩。
 * 注意：
 *  - RTL 的自动 cleanup 依赖全局 afterEach（vitest 默认未开 globals），须手动
 *    afterEach(cleanup)，否则多次 render 的 DOM 会累积导致 "multiple elements"。
 *  - 空查询时组件有意不渲染结果（searchPosts 空查询返回 []），断言前必须先输入。
 *  - framer-motion 在 jsdom 需要 matchMedia 垫片（jsdom 未实现）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SearchModal from '@/components/UI/SearchModal';

/* ── 依赖 mock ── */
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, prefetch: vi.fn() }),
}));

/* ── jsdom 缺失的 API 垫片 ── */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

const INDEX = [
  {
    slug: 'react-server-components-实战与踩坑',
    title: 'React Server Components 实战与踩坑',
    date: '2026-01-10',
    excerpt: 'RSC 边界实践',
    tags: ['React'],
  },
  {
    slug: 'redis-分布式锁实战',
    title: 'Redis 分布式锁实战',
    date: '2026-03-05',
    excerpt: 'SETNX 与 Redisson',
    tags: ['Redis'],
  },
];

const PLACEHOLDER = '搜索文章（空格分隔多关键词）...';

describe('SearchModal', () => {
  beforeEach(() => {
    push.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(INDEX),
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('输入多关键词 AND 过滤，ArrowDown + Enter 跳转到文章', async () => {
    render(<SearchModal open onClose={() => {}} />);
    const input = await screen.findByPlaceholderText(PLACEHOLDER);

    // 空查询不渲染结果（组件契约：searchPosts 空词元返回 []）
    expect(screen.queryByRole('link')).toBeNull();

    // 双关键词 AND：只有 Redis 那篇两个词元都命中
    fireEvent.change(input, { target: { value: 'redis 锁' } });
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(1);
      expect(links[0]?.textContent).toContain('Redis 分布式锁实战');
    });

    // 键盘流：选中第一项 + Enter 跳转
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(push).toHaveBeenCalledWith('/posts/redis-分布式锁实战/');
  });

  it('无匹配时显示无结果态（含查询词回显）', async () => {
    render(<SearchModal open onClose={() => {}} />);
    const input = await screen.findByPlaceholderText(PLACEHOLDER);

    fireEvent.change(input, { target: { value: '不存在的词xyz' } });
    await waitFor(() =>
      expect(screen.getByText('未找到与「不存在的词xyz」匹配的文章')).toBeTruthy(),
    );
  });

  it('Escape 关闭模态', async () => {
    const onClose = vi.fn();
    render(<SearchModal open onClose={onClose} />);
    const input = await screen.findByPlaceholderText(PLACEHOLDER);

    fireEvent.change(input, { target: { value: 'redis' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
