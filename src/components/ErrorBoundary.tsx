'use client';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * 全站 Error Boundary —— 兜底任何未捕获的 client 组件异常。
 * -----------------------------
 * 之前 Navbar / SearchModal / HeroParallax 等 client 组件抛异常会直接白屏整页。
 * 本组件收口在 Providers 顶层，渲染失败时显示通用错误 UI + 重试按钮，
 * 避免用户看到空白页面。
 *
 * 约定 #21（StrictMode 幂等）适用：getDerivedStateFromError 是纯函数无副作用，safe。
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // 开发期打印到控制台，生产环境静默（不暴露内部信息）
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] caught:', error, info.componentStack);
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-ink text-fg">
          <div className="text-center px-4">
            <p className="text-xl font-semibold mb-2">出了点问题</p>
            <p className="text-gray-500 text-sm mb-6">页面渲染异常，请重试。</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-lg glass glass-flat btn-retry text-sm"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
