// @vitest-environment jsdom
/**
 * BackButton 组件级测试 —— 文章页返回按钮的点击判定。
 * -----------------------------
 * 契约（移动端两个历史故障的修复面）：
 *  - 链条确有站内上一页（链尾=当前页）→ preventDefault + router.back()；
 *  - 无上一页 / 链尾非当前页（陈旧链）/  sessionStorage 不可用 → 放行默认
 *    href="/" 回首页（与 SSR 降级、pre-hydration 内联脚本行为一致）；
 *  - SSR 契约：href="/" + data-back-link 标（内联脚本识别用）；
 *  - hydration 交接：挂载写 html[data-back-ready] 并派发 backbutton:ready，
 *    卸载移除（内联脚本让位信号）。
 * 红线 #46：vitest 未开 globals，手动 afterEach(cleanup)。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BackButton from '@/components/UI/BackButton';
import { NAV_HISTORY_KEY } from '@/lib/nav-history';

/* ── 依赖 mock：next/link → 纯 <a>；next/navigation → 可控 router ── */
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

const back = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back, push: vi.fn(), prefetch: vi.fn() }),
}));

/* ── jsdom 缺失的 API 垫片（framer-motion whileHover 需要 matchMedia）── */
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

/** 把当前路径改成 pathname（jsdom 支持 history.pushState 改 location.pathname） */
function setPathname(pathname: string): void {
  window.history.pushState({}, '', pathname);
}

/** 点击返回按钮并捕获事件对象（判断 defaultPrevented） */
function clickBack(): { defaultPrevented: boolean } {
  const anchor = screen.getByText('返回').closest('a') as HTMLAnchorElement;
  let captured: MouseEvent | null = null;
  anchor.addEventListener('click', (e) => {
    captured = e;
  });
  fireEvent.click(anchor);
  return {
    defaultPrevented: (captured as unknown as MouseEvent | null)?.defaultPrevented ?? false,
  };
}

beforeEach(() => {
  back.mockClear();
  window.sessionStorage.clear();
  document.documentElement.removeAttribute('data-back-ready');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // 还原被 length=1 用例遮蔽的 history.length（删实例属性，恢复原型 getter）
  delete (window.history as unknown as { length?: number }).length;
});

describe('BackButton 点击判定', () => {
  it('链条确有站内上一页 → preventDefault + router.back()', () => {
    setPathname('/posts/a/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/archive/', '/posts/a/']));
    render(<BackButton />);
    const r = clickBack();
    expect(r.defaultPrevented).toBe(true);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('无上一页（链=[当前页]，外站直达/新标签）→ 放行默认回首页', () => {
    setPathname('/posts/a/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/posts/a/']));
    render(<BackButton />);
    const r = clickBack();
    expect(r.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });

  it('空链（sessionStorage 无记录）→ 放行默认回首页', () => {
    setPathname('/posts/a/');
    render(<BackButton />);
    const r = clickBack();
    expect(r.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });

  it('陈旧链（链尾≠当前页）→ 防误返，放行默认', () => {
    setPathname('/posts/b/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/posts/a/']));
    render(<BackButton />);
    const r = clickBack();
    expect(r.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });

  it('history.length ≤ 1（链与历史栈背离，如复制标签页）→ 放行默认，防 back() 无操作', () => {
    setPathname('/posts/a/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/posts/a/']));
    Object.defineProperty(window.history, 'length', { configurable: true, value: 1 });
    render(<BackButton />);
    const r = clickBack();
    expect(r.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });

  it('sessionStorage 读抛错（隐私模式）→ 降级放行默认', () => {
    setPathname('/posts/a/');
    // jsdom 的 sessionStorage 是 Storage Proxy：spyOn(实例) 静默失效，须 spy 原型
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    render(<BackButton />);
    const r = clickBack();
    expect(r.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });
});

describe('BackButton SSR/交接契约', () => {
  it('渲染 href="/" 且带 data-back-link 标（pre-hydration 脚本识别）', () => {
    setPathname('/posts/a/');
    render(<BackButton />);
    const anchor = screen.getByText('返回').closest('a') as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('/');
    expect(anchor.hasAttribute('data-back-link')).toBe(true);
  });

  it('挂载写 html[data-back-ready] 并派发 backbutton:ready；卸载移除', () => {
    setPathname('/posts/a/');
    const onReady = vi.fn();
    // CustomEvent 默认不冒泡（与 navloading:ready 同款）：捕获阶段监听才能收到
    document.addEventListener('backbutton:ready', onReady, true);
    const { unmount } = render(<BackButton />);
    expect(document.documentElement.hasAttribute('data-back-ready')).toBe(true);
    expect(onReady).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.documentElement.hasAttribute('data-back-ready')).toBe(false);
    document.removeEventListener('backbutton:ready', onReady, true);
  });
});
