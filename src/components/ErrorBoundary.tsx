'use client';
import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  /** 已重挂次数：>0 表示软重试已尝试过，再点「重试」直接整页刷新 */
  retryCount: number;
}

/**
 * 全站 Error Boundary —— 兜底任何未捕获的 client 组件异常。
 * -----------------------------
 * 之前 Navbar / SearchModal / HeroParallax 等 client 组件抛异常会直接白屏整页。
 * 本组件收口在 Providers 顶层，渲染失败时显示通用错误 UI + 重试按钮，
 * 避免用户看到空白页面。
 *
 * 恢复策略（两级）：
 *  1. 软重试：keyed Fragment 重挂整棵子树（非只翻 hasError 位——同一实例重渲染会
 *     立刻再次抛错），临时性故障（渲染竞态/脏 state）可恢复；
 *  2. 硬恢复：重挂后仍崩溃，说明错误稳定复现，「重试」升级为 location.reload()，
 *     另始终提供「刷新页面」次按钮。
 *
 * 约定 #21（StrictMode 幂等）适用：getDerivedStateFromError 是纯函数无副作用，safe。
 * 底色按 conventions §12 固定亮色（bg-stone-50 text-stone-900）：异常状态下主题样式
 * 可能已不可靠，错误屏统一亮色底，避免暗色主题里异常页呈黑底（文档明确要求，不用透明）。
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Pick<State, 'hasError'> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // 开发期打印到控制台，生产环境静默（不暴露内部信息）
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] caught:', error, info.componentStack);
    }
  }

  /** 重试：第一次重挂子树；重挂后仍在错误态（稳定复现）则整页刷新 */
  private handleRetry = (): void => {
    if (this.state.retryCount > 0) {
      window.location.reload();
      return;
    }
    this.setState((s) => ({ hasError: false, retryCount: s.retryCount + 1 }));
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-dvh flex items-center justify-center px-4 bg-stone-50 text-stone-900"
        >
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">出了点问题</p>
            <p className="text-stone-500 text-sm mb-6">页面渲染异常，请重试。</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-lg glass glass-flat btn-retry text-sm"
              >
                {this.state.retryCount > 0 ? '刷新页面' : '重试'}
              </button>
              {this.state.retryCount === 0 && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg text-sm text-stone-500 transition-colors hover:text-stone-900"
                >
                  刷新页面
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    // keyed Fragment：retryCount 变化即整树卸载重挂（key 变化不复用实例）
    return <Fragment key={this.state.retryCount}>{this.props.children}</Fragment>;
  }
}
