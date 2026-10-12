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
  // jsdom 未实现 execCommand，兜底用例通过 defineProperty 挂载（configurable，可删）
  Reflect.deleteProperty(document, 'execCommand');
});

/** 挂载 document.execCommand mock（jsdom 不提供该属性，spyOn 无法挂接） */
function stubExecCommand(result: boolean) {
  Object.defineProperty(document, 'execCommand', {
    value: vi.fn(() => result),
    configurable: true,
  });
  return document.execCommand as unknown as ReturnType<typeof vi.fn>;
}

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
    expect(copy.textContent).toBe('✓ 已复制!');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(copy.textContent).toBe('复制');
  });

  it('Clipboard API 拒绝时回退 execCommand：兜底成功仍显示已复制', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    const execSpy = stubExecCommand(true);

    injectOnce('<article><pre><code class="hljs language-ts">const x = 1;</code></pre></article>');
    const copy = document.querySelector('.code-window-copy') as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(copy);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(execSpy).toHaveBeenCalledWith('copy');
    expect(copy.textContent).toBe('✓ 已复制!');
    expect(copy.classList.contains('code-window-copy-fail')).toBe(false);
  });

  it('两条复制路径都失败时显示「复制失败」并在 2s 后复位', async () => {
    vi.useFakeTimers();
    // 无 navigator.clipboard（afterEach 已删），execCommand 返回 false
    stubExecCommand(false);

    injectOnce('<article><pre><code class="hljs language-ts">const x = 1;</code></pre></article>');
    const copy = document.querySelector('.code-window-copy') as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(copy);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(copy.textContent).toBe('复制失败');
    expect(copy.classList.contains('code-window-copy-fail')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(copy.textContent).toBe('复制');
    expect(copy.classList.contains('code-window-copy-fail')).toBe(false);
  });

  it('in-flight 锁：clipboard pending 期间连点只触发一次复制，且 pending 时保持原态', async () => {
    vi.useFakeTimers();
    let resolveWrite: (() => void) | undefined;
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    injectOnce('<article><pre><code class="hljs language-ts">const x = 1;</code></pre></article>');
    const copy = document.querySelector('.code-window-copy') as HTMLButtonElement;

    fireEvent.click(copy);
    // 第二次点击落在第一次的 await pending 窗口内 → 必须被忽略
    fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(copy.textContent).toBe('复制');

    await act(async () => {
      resolveWrite?.();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(copy.textContent).toBe('✓ 已复制!');
  });

  it('成功态 2s 内再次点击：旧复位计时作废，以新一轮为准不闪回', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    injectOnce('<article><pre><code class="hljs language-ts">const x = 1;</code></pre></article>');
    const copy = document.querySelector('.code-window-copy') as HTMLButtonElement;

    // 第一轮：复制成功
    await act(async () => {
      fireEvent.click(copy);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(copy.textContent).toBe('✓ 已复制!');

    // 距首轮复位还差 100ms 时再次点击（旧定时器若未提前清除，100ms 后会闪回「复制」）
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    await act(async () => {
      fireEvent.click(copy);
      await Promise.resolve();
      await Promise.resolve();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(copy.textContent).toBe('✓ 已复制!');

    // 以第二轮点击为起点 2s 后才复位
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(copy.textContent).toBe('复制');
  });
});
