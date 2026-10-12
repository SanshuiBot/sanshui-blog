// @vitest-environment jsdom
/**
 * NavigationLoading 组件级测试 —— 全站内部链接委托 + 300ms 门控状态机契约。
 * -----------------------------
 * 契约：
 *  - isInternalNavigation 判定矩阵：内部路由通过；外链/纯锚点/同 URL 重复/静态文件/
 *    target=_blank/download/修饰键由委托外层过滤；
 *  - 点击内部链接即 arm：<300ms 完成（pathname 变化）胶囊永不出现（快跳转零闪烁）；
 *    >300ms 显示胶囊并 polite 播报，pathname 变化后隐藏；
 *  - 命令式 startNavigation（搜索键盘 Enter 的 router.push）同样受门控；
 *  - popstate（前进/后退）arm；pageshow bfcache 恢复关闭残留胶囊；
 *  - 门控等待中重复触发不重置；显示中再触发不重新门控（连续跳转不闪）；
 *  - 10s 兜底自动隐藏；挂载写 data-nav-loading-ready 交接标记，卸载移除；
 *    卸载后 timer 不再 setState。
 * 红线 #46：vitest 未开 globals，手动 afterEach(cleanup)。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import {
  NavigationLoadingProvider,
  useNavigationLoading,
  isInternalNavigation,
  NAV_LOADING_SHOW_DELAY_MS,
  NAV_LOADING_FALLBACK_MS,
} from '@/components/UI/NavigationLoading';

/* usePathname：模块级可变桩，用例内改路径后 rerender 模拟客户端路由变化 */
let currentPath = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
}));

const LOC = {
  origin: 'http://localhost:3000',
  pathname: '/archive/',
  search: '',
  hash: '',
  href: 'http://localhost:3000/archive/',
};

function anchor(href: string, extra: Record<string, string> = {}): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  for (const [k, v] of Object.entries(extra)) a.setAttribute(k, v);
  return a;
}

/* ── isInternalNavigation 纯函数判定矩阵 ── */
describe('isInternalNavigation 判定矩阵（basePath 为空）', () => {
  it('站内路由：通过', () => {
    expect(isInternalNavigation(anchor('/posts/x/'), LOC, '')).toBe(true);
    expect(isInternalNavigation(anchor('/about'), LOC, '')).toBe(true);
    expect(isInternalNavigation(anchor('/tags/CSS/'), LOC, '')).toBe(true);
    expect(isInternalNavigation(anchor('/?x=1'), LOC, '')).toBe(true);
  });

  it('basePath 双态：/sanshui-blog 之下通过，之外拒绝', () => {
    expect(isInternalNavigation(anchor('/sanshui-blog/posts/x/'), LOC, '/sanshui-blog')).toBe(true);
    expect(isInternalNavigation(anchor('/sanshui-blog/about'), LOC, '/sanshui-blog')).toBe(true);
    expect(isInternalNavigation(anchor('/posts/x/'), LOC, '/sanshui-blog')).toBe(false);
    expect(isInternalNavigation(anchor('/other/'), LOC, '/sanshui-blog')).toBe(false);
  });

  it('纯 hash 同页锚点：拒绝', () => {
    // href 用绝对 URL 锚定 LOC（createElement 的相对解析以 jsdom 当前页为基）
    expect(isInternalNavigation(anchor('http://localhost:3000/archive/#section-2'), LOC, '')).toBe(
      false,
    );
    expect(isInternalNavigation(anchor('/archive/#section-2'), LOC, '')).toBe(false);
  });

  it('同 URL 重复点击：拒绝', () => {
    expect(isInternalNavigation(anchor('/archive/'), LOC, '')).toBe(false);
    expect(
      isInternalNavigation(
        anchor('/archive/?q=1'),
        { ...LOC, search: '?q=1', href: LOC.origin + '/archive/?q=1' },
        '',
      ),
    ).toBe(false);
  });

  it('带扩展名的静态文件：拒绝（feed.xml/og.png/robots.txt/favicon）', () => {
    expect(isInternalNavigation(anchor('/feed.xml'), LOC, '')).toBe(false);
    expect(isInternalNavigation(anchor('/og.png'), LOC, '')).toBe(false);
    expect(isInternalNavigation(anchor('/favicon.ico'), LOC, '')).toBe(false);
    expect(isInternalNavigation(anchor('/robots.txt'), LOC, '')).toBe(false);
  });

  it('外链与协议相对 URL：拒绝', () => {
    expect(isInternalNavigation(anchor('https://example.com/x/'), LOC, '')).toBe(false);
    expect(isInternalNavigation(anchor('//example.com/x/'), LOC, '')).toBe(false);
  });
});

/* ── Provider 委托与门控 ── */
function Links() {
  return (
    <div>
      <a href="/about/">关于</a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 刻意用原生锚点验证 document 委托，不经过 <Link> */}
      <a href="/posts/hello/">文章</a>
      <a href="https://example.com/">外链</a>
      <a href="/feed.xml">订阅</a>
      <a href="#sec">锚点</a>
      <a href="/blank/" target="_blank">
        新标签
      </a>
    </div>
  );
}

function ImperativeButton() {
  const { startNavigation, done } = useNavigationLoading();
  return (
    <div>
      <button type="button" onClick={startNavigation}>
        start
      </button>
      <button type="button" onClick={done}>
        done
      </button>
    </div>
  );
}

function pill(): HTMLElement | null {
  return document.querySelector('.nav-loading-pill');
}
function liveRegion(): HTMLElement | null {
  return document.querySelector('[role="status"][aria-live="polite"]');
}

function renderTree() {
  return render(
    <NavigationLoadingProvider>
      <Links />
      <ImperativeButton />
    </NavigationLoadingProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.documentElement.removeAttribute('data-nav-loading-ready');
  currentPath = '/';
  window.history.replaceState(null, '', '/');
});

describe('NavigationLoading 全站委托与胶囊门控', () => {
  it('初始：胶囊常驻但隐藏，live 区静默，并写入 hydration 交接标记', () => {
    renderTree();
    expect(pill()?.classList.contains('is-visible')).toBe(false);
    expect(pill()?.getAttribute('aria-hidden')).toBe('true');
    expect(liveRegion()?.textContent).toBe('');
    expect(document.documentElement.hasAttribute('data-nav-loading-ready')).toBe(true);
  });

  it('任意内部链接点击 + 300ms 内 pathname 变化：胶囊永不出现（快跳转零闪烁）', () => {
    vi.useFakeTimers();
    const { getByText, rerender } = renderTree();
    fireEvent.click(getByText('关于'));
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS - 1));
    // 导航完成：pathname 切换
    currentPath = '/about/';
    rerender(
      <NavigationLoadingProvider>
        <Links />
        <ImperativeButton />
      </NavigationLoadingProvider>,
    );
    act(() => vi.advanceTimersByTime(100));
    expect(pill()?.classList.contains('is-visible')).toBe(false);
    expect(liveRegion()?.textContent).toBe('');
  });

  it('内部链接点击后 >300ms：显示胶囊并播报，pathname 变化后隐藏', () => {
    vi.useFakeTimers();
    const { getByText, rerender } = renderTree();
    fireEvent.click(getByText('文章'));
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS));
    expect(pill()?.classList.contains('is-visible')).toBe(true);
    expect(liveRegion()?.textContent).toBe('页面加载中…');
    expect(liveRegion()?.getAttribute('aria-busy')).toBe('true');

    currentPath = '/posts/hello/';
    rerender(
      <NavigationLoadingProvider>
        <Links />
        <ImperativeButton />
      </NavigationLoadingProvider>,
    );
    expect(pill()?.classList.contains('is-visible')).toBe(false);
    expect(pill()?.getAttribute('aria-hidden')).toBe('true');
    expect(liveRegion()?.textContent).toBe('');
    expect(liveRegion()?.getAttribute('aria-busy')).toBe('false');
  });

  it('外链 / 静态文件 / 纯锚点（相对当前页）/ target=_blank：不 arm', () => {
    vi.useFakeTimers();
    // 与 LOC 同构：当前页就在 /archive/，#sec 才是纯锚点
    window.history.replaceState(null, '', '/archive/');
    const { getByText } = renderTree();
    for (const label of ['外链', '订阅', '锚点', '新标签']) {
      fireEvent.click(getByText(label));
    }
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS + 100));
    expect(pill()?.classList.contains('is-visible')).toBe(false);
  });

  it('修饰键（ctrl/cmd/shift/alt）与右键：不 arm', () => {
    vi.useFakeTimers();
    const { getByText } = renderTree();
    const about = getByText('关于');
    fireEvent.click(about, { button: 0, ctrlKey: true });
    fireEvent.click(about, { button: 0, metaKey: true });
    fireEvent.click(about, { button: 0, shiftKey: true });
    fireEvent.click(about, { button: 0, altKey: true });
    fireEvent.click(about, { button: 2 });
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS + 50));
    expect(pill()?.classList.contains('is-visible')).toBe(false);
  });

  it('命令式 startNavigation（router.push 场景）同样受 300ms 门控', () => {
    vi.useFakeTimers();
    const { getByText } = renderTree();
    fireEvent.click(getByText('start'));
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS - 1));
    expect(pill()?.classList.contains('is-visible')).toBe(false);
    fireEvent.click(getByText('done'));
    act(() => vi.advanceTimersByTime(500));
    expect(pill()?.classList.contains('is-visible')).toBe(false);

    fireEvent.click(getByText('start'));
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS));
    expect(pill()?.classList.contains('is-visible')).toBe(true);
  });

  it('popstate（前进/后退，path 变化）arm；同页 #锚点 popstate 不 arm；bfcache pageshow 收尾', () => {
    vi.useFakeTimers();
    renderTree();
    // 同页 hash 变化也触发 popstate：必须忽略（TOC 锚点场景）
    window.history.pushState(null, '', '/#sec');
    act(() => {
      window.dispatchEvent(new Event('popstate'));
    });
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS));
    expect(pill()?.classList.contains('is-visible')).toBe(false);

    // 真正的前进/后退：path+search 键变化
    window.history.pushState(null, '', '/about/');
    act(() => {
      window.dispatchEvent(new Event('popstate'));
    });
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS));
    expect(pill()?.classList.contains('is-visible')).toBe(true);

    // bfcache 恢复：pageshow persisted=true 立即收尾（jsdom 无 PageTransitionEvent 构造）
    const ev = new Event('pageshow');
    Object.defineProperty(ev, 'persisted', { value: true });
    act(() => {
      window.dispatchEvent(ev);
    });
    expect(pill()?.classList.contains('is-visible')).toBe(false);
  });

  it(`兜底：完成信号漏调时 ${NAV_LOADING_FALLBACK_MS}ms 自动隐藏`, () => {
    vi.useFakeTimers();
    const { getByText } = renderTree();
    fireEvent.click(getByText('关于'));
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS));
    expect(pill()?.classList.contains('is-visible')).toBe(true);
    act(() => vi.advanceTimersByTime(NAV_LOADING_FALLBACK_MS));
    expect(pill()?.classList.contains('is-visible')).toBe(false);
  });

  it('显示中连续点击：保持显示不重新门控（无退场再进场闪烁）', () => {
    vi.useFakeTimers();
    const { getByText } = renderTree();
    fireEvent.click(getByText('关于'));
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS));
    expect(pill()?.classList.contains('is-visible')).toBe(true);
    fireEvent.click(getByText('文章'));
    act(() => vi.advanceTimersByTime(NAV_LOADING_SHOW_DELAY_MS - 1));
    expect(pill()?.classList.contains('is-visible')).toBe(true);
  });

  it('卸载：清理交接标记与遗留 timer，不再触发 setState', () => {
    vi.useFakeTimers();
    const { unmount } = renderTree();
    expect(() => {
      unmount();
      act(() => vi.advanceTimersByTime(NAV_LOADING_FALLBACK_MS));
    }).not.toThrow();
    expect(document.documentElement.hasAttribute('data-nav-loading-ready')).toBe(false);
  });
});
