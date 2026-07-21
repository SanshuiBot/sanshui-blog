'use client';

import { ReactNode, Children } from 'react';

interface WaterfallGridProps {
  children: ReactNode;
  className?: string;
  /** Number of columns at each breakpoint */
  columns?: { sm?: number; md?: number };
  /** Gap size between columns */
  gap?: 'sm' | 'md' | 'lg';
}

const GAP_MAP: Record<string, string> = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

const COL_MAP: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
};

export default function WaterfallGrid({
  children,
  className = '',
  columns = { sm: 2, md: 3 },
  gap = 'md',
}: WaterfallGridProps) {
  const gapClass = GAP_MAP[gap] ?? GAP_MAP.md;

  // Build column classes dynamically — use explicit responsive classes
  // so Tailwind's engine can find them at build time
  const getColumnsClass = () => {
    const base = columns.md ? COL_MAP[columns.md] : '2';
    const smBase = columns.sm ? COL_MAP[columns.sm] : base;
    return `columns-${smBase} sm:columns-${base}`;
  };

  return (
    <div
      className={`${getColumnsClass()} ${gapClass} ${className}`}
    >
      {Children.map(children, (child) => (
        <div className="break-inside-avoid mb-6">
          {child}
        </div>
      ))}
    </div>
  );
}
