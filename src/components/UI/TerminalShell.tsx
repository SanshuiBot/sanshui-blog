'use client';

import '@/styles/terminal-base.css';

interface TerminalShellProps {
  /** 标题栏文字，如 `sanshui@blog ~/friends` */
  title?: string;
  /** 右侧状态文字，如 `streaming…` */
  status?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 共享终端窗口外壳（macOS 风格标题栏 + 毛玻璃体）。
 *
 * 链接页与简历页共用，样式定义在 terminal-base.css。
 * 具体页面包裹自己的 body 层（.terminal-body / .resume-body）。
 */
export default function TerminalShell({ title, status, children, className }: TerminalShellProps) {
  return (
    <div className={`terminal-shell ${className ?? ''}`}>
      {(title || status) && (
        <div className="terminal-shell-titlebar">
          <span className="terminal-shell-dot terminal-shell-dot-red" />
          <span className="terminal-shell-dot terminal-shell-dot-yellow" />
          <span className="terminal-shell-dot terminal-shell-dot-green" />
          {title && <span className="terminal-shell-title">{title}</span>}
          {status && <span className="ml-auto terminal-shell-status">{status}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
