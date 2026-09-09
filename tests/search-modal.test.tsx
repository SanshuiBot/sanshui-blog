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
    // 结果项在 listbox 下带 role="option"（ARIA 列表模式），不再查询 role="link"
    fireEvent.change(input, { target: { value: 'redis 锁' } });
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(1);
      expect(options[0]?.textContent).toContain('Redis 分布式锁实战');
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

  it('触屏设备：面板挂 lite 变体（去 backdrop-filter），遮罩加压不透出正文', async () => {
    // 模拟手机：maxTouchPoints > 0（jsdom 默认 0，桌面路径）
    const proto = Object.getPrototypeOf(window.navigator) as Record<string, unknown>;
    const desc = Object.getOwnPropertyDescriptor(proto, 'maxTouchPoints');
    Object.defineProperty(proto, 'maxTouchPoints', { value: 1, configurable: true });

    try {
      render(<SearchModal open onClose={() => {}} />);
      await screen.findByPlaceholderText(PLACEHOLDER);

      const panel = document.querySelector('.search-modal-panel');
      expect(panel).toBeTruthy();
      expect(panel?.className).toContain('search-modal-panel--lite');
      // 遮罩：触屏路径挂 8px backdrop-blur 糊掉背景文字（非 -sm 变体），
      // 75 不透明度压暗背景——既要压暗也要糊掉，否则手机上仍能辨认后面的字
      const mask = document.querySelector('.fixed.inset-0.bg-black\\/75');
      expect(mask).toBeTruthy();
      expect(mask?.className.split(' ')).toContain('backdrop-blur');
      expect(mask?.className).not.toContain('backdrop-blur-sm');
    } finally {
      if (desc) Object.defineProperty(proto, 'maxTouchPoints', desc);
      else delete proto.maxTouchPoints;
      cleanup();
    }
  });

  it('桌面设备（无触摸点）：不挂 lite 变体，保留 backdrop-blur 遮罩', async () => {
    render(<SearchModal open onClose={() => {}} />);
    await screen.findByPlaceholderText(PLACEHOLDER);

    const panel = document.querySelector('.search-modal-panel');
    expect(panel).toBeTruthy();
    expect(panel?.className).not.toContain('search-modal-panel--lite');
    const mask = document.querySelector('.fixed.inset-0.bg-black\\/60');
    expect(mask?.className).toContain('backdrop-blur-sm');
  });
});
