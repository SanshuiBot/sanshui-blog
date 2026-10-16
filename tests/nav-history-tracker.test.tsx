// @vitest-environment jsdom
/**
 * NavHistoryTracker 组件级测试 —— 站内导航链的写入规则。
 * -----------------------------
 * 覆盖（BackButton 判定信号的来源，对应移动端两个历史故障的修复面）：
 *  - 文档加载 referrer 规则：同源路由（reload 自指/本站全文档导航）→ 保留链；
 *    外站/空（新标签、书签、地址栏）/静态文件 → 重置为 [当前页]；
 *  - 路由变化（软导航/popstate）→ syncNavHistory 镜像（追加/回退截断）；
 *  - 捕获阶段跨域 http(s) 链接点击 → 重置（离开后再回来应回首页）；
 *    同源链接/target=_blank/修饰键 → 不动。
 * usePathname：模块级可变桩，rerender 模拟客户端路由变化（同 navigation-loading.test.tsx）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import NavHistoryTracker from '@/components/UI/NavHistoryTracker';
import { NAV_HISTORY_KEY } from '@/lib/nav-history';

/* usePathname：模块级可变桩 */
let currentPath = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
}));

/** jsdom 的 document.referrer 是原型访问器：定义实例属性遮蔽 */
function setReferrer(referrer: string): void {
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    get: () => referrer,
  });
}

function setPathname(pathname: string): void {
  window.history.pushState({}, '', pathname);
}

/** 同源路由 referrer：模拟 reload 自指/本站全文档导航（挂载时保留链） */
function keepChainReferrer(): void {
  setReferrer('http://localhost:3000/archive/');
}

function currentChain(): string[] {
  return JSON.parse(window.sessionStorage.getItem(NAV_HISTORY_KEY) ?? '[]') as string[];
}

function anchor(href: string, extra: Record<string, string> = {}): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  for (const [k, v] of Object.entries(extra)) a.setAttribute(k, v);
  document.body.appendChild(a);
  return a;
}

beforeEach(() => {
  currentPath = '/';
  window.sessionStorage.clear();
  setReferrer('');
});

afterEach(() => {
  cleanup();
  setReferrer('');
});

describe('文档加载 referrer 规则', () => {
  it('同源路由 referrer（reload 自指/本站全文档导航）→ 保留链并同步当前页', () => {
    setPathname('/posts/a/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/archive/']));
    setReferrer('http://localhost:3000/archive/');
    currentPath = '/posts/a/';
    render(<NavHistoryTracker />);
    expect(currentChain()).toEqual(['/', '/archive/', '/posts/a/']);
  });

  it('外站 referrer → 重置为 [当前页]（下方条目不可信）', () => {
    setPathname('/posts/a/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/archive/']));
    setReferrer('https://example.com/some-page');
    currentPath = '/posts/a/';
    render(<NavHistoryTracker />);
    expect(currentChain()).toEqual(['/posts/a/']);
  });

  it('空 referrer（新标签/书签/地址栏/标签页恢复）→ 重置', () => {
    setPathname('/posts/a/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/archive/']));
    setReferrer('');
    currentPath = '/posts/a/';
    render(<NavHistoryTracker />);
    expect(currentChain()).toEqual(['/posts/a/']);
  });

  it('同源静态文件 referrer（/feed.xml）→ 重置', () => {
    setPathname('/posts/a/');
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/archive/']));
    setReferrer('http://localhost:3000/feed.xml');
    currentPath = '/posts/a/';
    render(<NavHistoryTracker />);
    expect(currentChain()).toEqual(['/posts/a/']);
  });
});

describe('路由变化镜像', () => {
  it('软导航新页面 → 追加', () => {
    setPathname('/');
    currentPath = '/';
    keepChainReferrer();
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/']));
    const { rerender } = render(<NavHistoryTracker />);
    setPathname('/posts/a/');
    currentPath = '/posts/a/';
    rerender(<NavHistoryTracker />);
    expect(currentChain()).toEqual(['/', '/posts/a/']);
  });

  it('浏览器后退回到旧条目 → 镜像截断', () => {
    setPathname('/posts/b/');
    currentPath = '/posts/b/';
    keepChainReferrer();
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/posts/a/', '/posts/b/']));
    const { rerender } = render(<NavHistoryTracker />);
    setPathname('/posts/a/');
    currentPath = '/posts/a/';
    rerender(<NavHistoryTracker />);
    expect(currentChain()).toEqual(['/', '/posts/a/']);
  });
});

describe('跨域链接点击截断', () => {
  it('跨域 http(s) 链接（本标签页）→ 重置为 [当前页]', () => {
    setPathname('/posts/a/');
    currentPath = '/posts/a/';
    keepChainReferrer();
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/archive/', '/posts/a/']));
    render(<NavHistoryTracker />);
    const a = anchor('https://example.com/');
    fireEvent.click(a);
    expect(currentChain()).toEqual(['/posts/a/']);
  });

  it('同源链接 → 不动', () => {
    setPathname('/posts/a/');
    currentPath = '/posts/a/';
    keepChainReferrer();
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/archive/', '/posts/a/']));
    render(<NavHistoryTracker />);
    const a = anchor('/archive/');
    fireEvent.click(a);
    expect(currentChain()).toEqual(['/', '/archive/', '/posts/a/']);
  });

  it('跨域链接但 target=_blank（不离开当前文档）→ 不动', () => {
    setPathname('/posts/a/');
    currentPath = '/posts/a/';
    keepChainReferrer();
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/posts/a/']));
    render(<NavHistoryTracker />);
    const a = anchor('https://example.com/', { target: '_blank' });
    fireEvent.click(a);
    expect(currentChain()).toEqual(['/', '/posts/a/']);
  });

  it('跨域链接但带修饰键（新标签打开）→ 不动', () => {
    setPathname('/posts/a/');
    currentPath = '/posts/a/';
    keepChainReferrer();
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(['/', '/posts/a/']));
    render(<NavHistoryTracker />);
    const a = anchor('https://example.com/');
    fireEvent.click(a, { metaKey: true });
    expect(currentChain()).toEqual(['/', '/posts/a/']);
  });
});
