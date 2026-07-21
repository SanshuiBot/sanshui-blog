'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Enable hover micro-interactions (default: true) */
  hover?: boolean;
  /** Strength of the glass effect */
  strength?: 'soft' | 'strong';
  /** Add a subtle gradient border on hover */
  gradientBorder?: boolean;
}

const STRENGTH_CLASSES: Record<string, string> = {
  soft: 'glass',
  strong: 'glass-strong',
};

export default function GlassCard({
  children,
  className = '',
  hover = true,
  strength = 'soft',
  gradientBorder = false,
}: GlassCardProps) {
  const hoverClasses = hover
    ? 'transition-all duration-700 ease-[var(--ease-out-quint)] hover:scale-[1.02] hover:shadow-holographic'
    : '';

  const borderWrapper = gradientBorder
    ? `group/card relative p-[1.5px] rounded-2xl bg-gradient-to-b from-stone-200/60 via-violet-200/30 to-transparent dark:from-stone-800/40 dark:via-violet-900/20 dark:to-transparent transition-all duration-700 ease-[var(--ease-out-quint)] group-hover/card:from-pink-500/40 group-hover/card:via-violet-500/30 group-hover/card:to-cyan-500/20 dark:group-hover/card:from-pink-500/50 dark:group-hover/card:via-violet-500/40 dark:group-hover/card:to-cyan-500/30`
    : '';

  const innerContent = (
    <div
      className={`rounded-2xl p-6 ${STRENGTH_CLASSES[strength]} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );

  return gradientBorder ? (
    <div className={borderWrapper}>{innerContent}</div>
  ) : (
    innerContent
  );
}
