// @vitest-environment jsdom
/**
 * CodeCopyInjector 组件级测试 —— 终端窗口外壳注入契约。
 * -----------------------------
 * 覆盖审查（review finding 4）点名的高风险路径：
 *  - 完整外壳注入：标题栏圆点/语言名/复制按钮 + 行号栏 + 滚动容器 + data-ci 标记
 *  - data-ci 幂等守卫：MutationObserver 触发的二次 inject 不重复注入外壳
 *  - 行号计数边界：多行 / 尾换行 / 空内容
 *  - 语言名解析：映射表 / 未知语言首字母大写 / 缺失回退「代码」
 *  - 无 <code> 子节点的 pre 不打 data-ci（可重试，不永久跳过）
 *  - 复制按钮：clipboard mock 下 复制 → 已复制! → 2s 恢复
 * 注意：
 *  - vitest 未开 globals，须手动 afterEach(cleanup)（红线 46）。
 *  - 组件用 setTimeout(100) + MutationObserver 注入，测试用 fake timers 驱动。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import CodeCopyInjector from '@/components/Post/CodeCopyInjector';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.innerHTML = '';
  Reflect.deleteProperty(navigator, 'clipboard');
});

/** 重置 body、渲染组件并推进注入定时器 */
function injectOnce(html: string) {
  document.body.innerHTML = html;
  render(<CodeCopyInjector />);
  act(() => {
    vi.advanceTimersByTime(100);
  });
}

describe('CodeCopyInjector', () => {
  it('为代码块注入完整终端窗口外壳', () => {
    vi.useFakeTimers();
    injectOnce(
      '<article><pre><code class="hljs language-ts">const a = 1;\nconst b = 2;</code></pre></article>',
    );

    const pre = document.querySelector('article pre')!;
    expect(pre.getAttribute('data-ci')).toBe('true');
    expect(pre.querySelectorAll('.code-window-dot').length).toBe(3);
    expect(pre.querySelector('.code-window-title')?.textContent).toBe('TypeScript');
    expect(pre.querySelector('.code-window-copy')?.textContent).toBe('复制');
    expect(pre.querySelector('.code-window-lines')?.textContent).toBe('1\n2');
    expect(pre.querySelector('.code-window-scroll')?.querySelector('code')).not.toBeNull();
  });

  it('data-ci 幂等守卫：观察器触发的二次 inject 不重复注入', async () => {
    vi.useFakeTimers();
    injectOnce('<article><pre><code class="hljs language-ts">a\nb</code></pre></article>');
    expect(document.querySelectorAll('.code-window-bar').length).toBe(1);

    // 触发一次 DOM 变更 → MutationObserver 回调 → inject 再次执行
    document.body.appendChild(document.createElement('div'));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.querySelectorAll('.code-window-bar').length).toBe(1);
    expect(document.querySelectorAll('.code-window-lines').length).toBe(1);
  });

  it('行号计数：多行 / 尾换行 / 空内容', () => {
    vi.useFakeTimers();
    document.body.innerHTML = [
      '<article>',
      '<pre><code class="hljs language-ts">a\nb\nc</code></pre>',
      '<pre><code class="hljs language-ts">a\nb\n</code></pre>',
      '<pre><code class="hljs language-text"></code></pre>',
      '</article>',
    ].join('');
    render(<CodeCopyInjector />);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const lines = [...document.querySelectorAll('.code-window-lines')].map((el) => el.textContent);
    expect(lines).toEqual(['1\n2\n3', '1\n2', '1']);
  });

  it('标题栏语言名：映射表 / 未知语言首字母大写 / 缺失回退', () => {
    vi.useFakeTimers();
    document.body.innerHTML = [
      '<article>',
      '<pre><code class="hljs language-ts">x</code></pre>',
      '<pre><code class="hljs language-kotlin">y</code></pre>',
      '<pre><code class="hljs">z</code></pre>',
      '</article>',
    ].join('');
    render(<CodeCopyInjector />);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const titles = [...document.querySelectorAll('.code-window-title')].map((el) => el.textContent);
    expect(titles).toEqual(['TypeScript', 'Kotlin', '代码']);
  });

  it('无 <code> 子节点的 pre 不打 data-ci（可重试不永久跳过）', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<article><pre>纯文本</pre></article>';
    render(<CodeCopyInjector />);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const pre = document.querySelector('article pre')!;
    expect(pre.hasAttribute('data-ci')).toBe(false);
    expect(pre.querySelector('.code-window-bar')).toBeNull();
  });

  it('复制按钮：复制 → 已复制! → 2s 恢复', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    injectOnce('<article><pre><code class="hljs language-ts">const x = 1;</code></pre></article>');
    const copy = document.querySelector('.code-window-copy') as HTMLButtonElement;

    // 点击 + 冲刷微任务放进同一个 async act：onclick 是 async 处理器，
    // 需要等 writeText 的 await 延续执行完，textContent 才会切到「已复制!」
    await act(async () => {
      fireEvent.click(copy);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('const x = 1;');
    expect(copy.textContent).toBe('已复制!');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(copy.textContent).toBe('复制');
  });
});
