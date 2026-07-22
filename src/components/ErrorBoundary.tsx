'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-stone-50 dark:bg-stone-950">
          <div className="max-w-md w-full space-y-8">
            {/* Error animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="text-center"
            >
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-cyan-500/10 dark:from-pink-500/20 dark:via-violet-500/20 dark:to-cyan-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-pink-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                  <RefreshCw size={32} className="text-white animate-spin" />
                </div>
              </div>
            </motion.div>

            {/* Error content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-4"
            >
              <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">
                页面出现错误
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                抱歉，出现了意外错误。我们已经记录了这个问题，请稍后再试。
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-stone-100 dark:bg-stone-800 rounded-lg p-4 text-left font-mono text-sm text-stone-700 dark:text-stone-300"
              >
                <p className="mb-1">错误信息:</p>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  {this.state.error?.message || '未知错误'}
                </p>
              </motion.div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <motion.button
                  onClick={this.resetError}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-lg hover:from-pink-600 hover:to-violet-700 transition-all duration-300 hover:shadow-lg hover:shadow-holographic/30"
                >
                  <RefreshCw size={18} className="mr-2" />
                  重试
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300"
                >
                  <Link href="/" className="flex items-center gap-2">
                    <ArrowLeft size={18} />
                    返回首页
                  </Link>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component wrapper for client components
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  _errorFallback?: React.ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Custom hook for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = (err: Error) => {
    setError(err);
    // Optionally send error to tracking service
    console.error('Error caught by useErrorHandler:', err);
  };

  const clearError = () => {
    setError(null);
  };

  React.useEffect(() => {
    if (error) {
      // Auto clear error after 5 seconds
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return { error, handleError, clearError };
}