'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  default: 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900',
  primary: 'bg-gradient-to-r from-pink-500 to-violet-600 text-white',
  secondary: 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
  outline: 'border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300',
  ghost: 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          relative inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-all duration-300 ease-[var(--ease-out-quint)]
          focus:outline-none focus:ring-2 focus:ring-pink-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${variant === 'outline' ? 'bg-white dark:bg-stone-900' : ''}
          ${variant === 'ghost' ? 'bg-transparent' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';