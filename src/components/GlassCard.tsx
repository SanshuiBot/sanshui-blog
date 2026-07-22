'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  strength?: 'soft' | 'strong';
  gradientBorder?: boolean;
  doubleBezel?: boolean;
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
  doubleBezel = false,
}: GlassCardProps) {
  const hoverClasses = hover
    ? 'transition-all duration-700 ease-[var(--ease-out-quint)] hover:scale-[1.01] hover:shadow-iridescent'
    : '';

  if (doubleBezel) {
    return (
      <div className={`double-bezel-outer group ${className}`}>
        <div className={`double-bezel-inner p-6 ${hoverClasses}`}>
          {children}
        </div>
      </div>
    );
  }

  const borderWrapper = gradientBorder
    ? `group/card relative p-[1.5px] rounded-2xl bg-gradient-to-b from-stone-200/60 via-violet-200/30 to-transparent dark:from-stone-800/40 dark:via-violet-900/20 dark:to-transparent transition-all duration-700 ease-[var(--ease-out-quint)] group-hover/card:from-pink-500/40 group-hover/card:via-violet-500/30 group-hover/card:to-cyan-500/20 dark:group-hover/card:from-pink-500/50 dark:group-hover/card:via-violet-500/40 dark:group-hover/card:to-cyan-500/30`
    : '';

  const innerContent = (
    <div className={`rounded-2xl p-6 ${STRENGTH_CLASSES[strength]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );

  return gradientBorder ? (
    <div className={borderWrapper}>{innerContent}</div>
  ) : innerContent;
}
