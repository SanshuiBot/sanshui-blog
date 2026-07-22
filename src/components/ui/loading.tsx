'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

interface LoadingSpinnerProps extends HTMLMotionProps<'div'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const variants = {
  default: 'border-stone-300 border-t-stone-900 dark:border-stone-700 dark:border-t-stone-200',
  primary: 'border-pink-300 border-t-pink-600 dark:border-pink-700 dark:border-t-pink-400',
  secondary: 'border-violet-300 border-t-violet-600 dark:border-violet-700 dark:border-t-violet-400',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}: LoadingSpinnerProps) {
  return (
    <motion.div
      className={`
        ${sizes[size]}
        ${variants[variant]}
        border-2 rounded-full
        animate-spin
        ${className}
      `}
      {...props}
      role="status"
      aria-label="加载中"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" variant="primary" />
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" variant="default" />
      <span className="text-sm text-stone-500">加载中...</span>
    </div>
  );
}