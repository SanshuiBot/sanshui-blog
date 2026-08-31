'use client';
import { useEffect } from 'react';

/**
 * 为文章页代码块注入「终端窗口」外壳（复用链接/简历页的终端叙事）：
 *
 *   ┌─────────────────────────────────┐
 *   │ ● ● ●  TypeScript          复制 │  ← 标题栏：macOS 圆点 + 语言名 + 复制按钮
 *   ├─────────────────────────────────┤
 *   │ 1  const x: number = 1;         │  ← 行号栏固定，横向滚动时不动
 *   │ 2  console.log(x);              │
 *   └─────────────────────────────────┘
 *
 * 语言名取自 rehype-highlight 写入 code 的 `language-*` 类（裸围栏经 detect 自动
 * 识别后补写类；plainText 语言保留原标签，见 PostContent）。行号按 code.textContent
 * 换行计数。MutationObserver 兜底 MDX 懒渲染动态内容。data-ci 在外壳完整注入后
 * 才标记，保证 StrictMode 双执行 / 观察器循环幂等，且回退布局只对已注入块切换。
 * 样式定义在 globals.css（.code-window-*，亮暗共用一套深色窗口，见红线 35/27）。
 */

/** hljs 语言名 → 标题栏展示名（只收本站文章实际用到的语言） */
const LANG_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  ts: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  javascript: 'JavaScript',
  js: 'JavaScript',
  go: 'Go',
  golang: 'Go',
  css: 'CSS',
  html: 'HTML',
  xml: 'XML',
  bash: 'Bash',
  shell: 'Shell',
  sh: 'Shell',
  zsh: 'Zsh',
  sql: 'SQL',
  java: 'Java',
  vue: 'Vue',
  dockerfile: 'Dockerfile',
  yaml: 'YAML',
  yml: 'YAML',
  ini: 'INI',
  python: 'Python',
  py: 'Python',
  protobuf: 'Protobuf',
  objc: 'Objective-C',
  http: 'HTTP',
  ruby: 'Ruby',
  promql: 'PromQL',
  json: 'JSON',
  gradle: 'Gradle',
  haproxy: 'HAProxy',
  diff: 'Diff',
  markdown: 'Markdown',
  md: 'Markdown',
  solidity: 'Solidity',
  plaintext: 'Text',
  text: 'Text',
};

/** 从 code 的 className（`language-xxx`）解析标题栏语言名 */
function languageLabel(code: HTMLElement): string {
  const m = code.className.match(/language-([\w+-]+)/);
  const key = m?.[1]?.toLowerCase() ?? '';
  if (!key) return '代码';
  return LANG_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export default function CodeCopyInjector() {
  useEffect(() => {
    const inject = () => {
      document.querySelectorAll<HTMLPreElement>('article pre:not([data-ci])').forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code) return;

        // ── 标题栏：圆点 + 语言名 + 复制按钮 ──
        const bar = document.createElement('div');
        bar.className = 'code-window-bar';

        const dots = document.createElement('span');
        dots.className = 'code-window-dots';
        dots.setAttribute('aria-hidden', 'true');
        for (const color of ['red', 'yellow', 'green'] as const) {
          const dot = document.createElement('i');
          dot.className = `code-window-dot code-window-dot-${color}`;
          dots.appendChild(dot);
        }

        const title = document.createElement('span');
        title.className = 'code-window-title';
        title.textContent = languageLabel(code);

        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'code-window-copy';
        copy.setAttribute('aria-label', '复制代码');
        copy.textContent = '复制';
        copy.onclick = async () => {
          try {
            await navigator.clipboard.writeText(code.textContent ?? '');
            copy.textContent = '已复制!';
            setTimeout(() => {
              copy.textContent = '复制';
            }, 2000);
          } catch {
            // Clipboard API 不可用时静默失败（同原实现）
          }
        };

        bar.append(dots, title, copy);

        // ── 行号栏（固定，不随横向滚动）──
        const text = code.textContent ?? '';
        const lineCount = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
        const lines = document.createElement('div');
        lines.className = 'code-window-lines';
        lines.setAttribute('aria-hidden', 'true');
        lines.textContent = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1).join(
          '\n',
        );

        // ── 滚动体：行号栏固定在外层，code 单独包一层横向滚动容器，
        //    保证横向滚动时行号栏不随内容滚走 ──
        const body = document.createElement('div');
        body.className = 'code-window-body';
        const scroll = document.createElement('div');
        scroll.className = 'code-window-scroll';
        scroll.appendChild(code);
        body.append(lines, scroll);

        pre.append(bar, body);
        // 外壳完整注入后才标记 data-ci：回退态 CSS（padding/overflow）只对已注入块切换，
        // 且无 <code> 子节点的 pre 不会被打上标记而永久跳过。
        pre.setAttribute('data-ci', 'true');
      });
    };

    // 初次注入（延迟一帧，等 MDX 首屏渲染完成）
    const timer = setTimeout(inject, 100);

    // 观察动态添加的 <pre>（MDX 懒渲染 / 客户端路由切页）
    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
