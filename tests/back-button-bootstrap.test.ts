// @vitest-environment jsdom
/**
 * createBackButtonScript 测试 —— 文章页返回按钮 hydration 前代劳脚本。
 * -----------------------------
 * 两层覆盖：
 *  1) 契约冒烟（同 navigation-loading-bootstrap.test.ts 惯例）：关键接线点在位；
 *  2) 行为：在 jsdom 里真实求值 IIFE，派发点击验证判定——
 *     链条有上一页 → preventDefault（location.assign 上一页，jsdom 不实现导航，
 *     以 defaultPrevented 为断言点）；无链/陈旧链/React 已接管/修饰键 → 放行默认。
 * 与 tests/back-button.test.tsx（hydration 后的 React 判定）共同覆盖返回按钮
 * 全时间线；浏览器端到端（移动端弱网实测）另行覆盖。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBackButtonScript } from '@/lib/back-button-bootstrap';

const KEY = 'sansui-nav-history';

afterEach(() => {
  window.sessionStorage.clear();
  document.documentElement.removeAttribute('data-back-ready');
  // 注销脚本监听（派发交接事件即自注销）
  document.dispatchEvent(new CustomEvent('backbutton:ready'));
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  // 还原被 length=1 用例遮蔽的 history.length（删实例属性，恢复原型 getter）
  delete (window.history as unknown as { length?: number }).length;
});

/** 在 jsdom 全局求值内联脚本并挂一个返回按钮锚点 */
function arm(pagePathname: string, chain?: unknown): HTMLAnchorElement {
  window.history.pushState({}, '', pagePathname);
  if (chain !== undefined) {
    window.sessionStorage.setItem(KEY, JSON.stringify(chain));
  }
  new Function(createBackButtonScript())();
  const a = document.createElement('a');
  a.href = '/';
  a.setAttribute('data-back-link', '');
  a.textContent = '返回';
  document.body.appendChild(a);
  return a;
}

function click(a: HTMLAnchorElement, init: MouseEventInit = {}): boolean {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  a.dispatchEvent(e);
  return e.defaultPrevented;
}

describe('createBackButtonScript 契约', () => {
  it('关键接线点在位：链键/标/交接/默认放行', () => {
    const s = createBackButtonScript();
    expect(s).toContain("var KEY = 'sansui-nav-history'");
    expect(s).toContain("closest('a[href]')");
    expect(s).toContain("hasAttribute('data-back-link')");
    expect(s).toContain('location.assign');
    expect(s).toContain('e.preventDefault()');
    expect(s).toContain("READY_ATTR = 'data-back-ready'");
    expect(s).toContain("'backbutton:ready'");
    expect(s).toContain('e.button !== 0');
    expect(s).toContain('e.metaKey');
  });
});

describe('createBackButtonScript 行为（jsdom 求值）', () => {
  it('链条有上一页且链尾=当前页 → 拦截（defaultPrevented）', () => {
    const a = arm('/posts/a/', ['/', '/archive/', '/posts/a/']);
    expect(click(a)).toBe(true);
  });

  it('无链（链=[当前页]）→ 放行默认 href="/"', () => {
    const a = arm('/posts/a/', ['/posts/a/']);
    expect(click(a)).toBe(false);
  });

  it('空链 → 放行默认', () => {
    const a = arm('/posts/a/');
    expect(click(a)).toBe(false);
  });

  it('陈旧链（链尾≠当前页）→ 放行默认', () => {
    const a = arm('/posts/b/', ['/', '/posts/a/']);
    expect(click(a)).toBe(false);
  });

  it('history.length ≤ 1（链与历史栈背离，如复制标签页）→ 放行默认', () => {
    const a = arm('/posts/a/', ['/', '/posts/a/']);
    Object.defineProperty(window.history, 'length', { configurable: true, value: 1 });
    expect(click(a)).toBe(false);
  });

  it('sessionStorage 读抛错（隐私模式）→ 放行默认', () => {
    const a = arm('/posts/a/', ['/', '/posts/a/']);
    // jsdom 的 sessionStorage 是 Storage Proxy：spyOn(实例) 静默失效，须 spy 原型
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(click(a)).toBe(false);
  });

  it('React 已接管（html[data-back-ready]）→ 自注销且不拦截', () => {
    const a = arm('/posts/a/', ['/', '/posts/a/']);
    document.documentElement.setAttribute('data-back-ready', '');
    expect(click(a)).toBe(false);
    // 已自注销：再点也不拦
    expect(click(a)).toBe(false);
  });

  it('修饰键点击（新标签打开）→ 不拦截', () => {
    const a = arm('/posts/a/', ['/', '/posts/a/']);
    expect(click(a, { ctrlKey: true })).toBe(false);
    expect(click(a, { metaKey: true })).toBe(false);
  });

  it('非返回按钮链接（无 data-back-link 标）→ 不拦截', () => {
    const a = arm('/posts/a/', ['/', '/posts/a/']);
    a.removeAttribute('data-back-link');
    expect(click(a)).toBe(false);
  });

  it('backbutton:ready 交接后自注销，不再拦截', () => {
    const a = arm('/posts/a/', ['/', '/posts/a/']);
    document.dispatchEvent(new CustomEvent('backbutton:ready'));
    expect(click(a)).toBe(false);
  });
});
