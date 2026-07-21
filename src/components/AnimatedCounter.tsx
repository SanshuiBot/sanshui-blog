'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  /** Trigger the animation when the element enters the viewport (default: true) */
  trigger?: boolean;
  /** Custom easing function: 'ease-out-cubic' | 'ease-out-quint' | 'ease-out-expo' */
  easing?: 'ease-out-cubic' | 'ease-out-quint' | 'ease-out-expo';
}

const EASING_MAP: Record<string, (t: number) => number> = {
  'ease-out-cubic': (t) => 1 - Math.pow(1 - t, 3),
  'ease-out-quint': (t) => 1 - Math.pow(1 - t, 5),
  'ease-out-expo': (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

const DEFAULT_EASE = EASING_MAP['ease-out-cubic'];

export default function AnimatedCounter({
  end,
  duration = 2,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
  trigger = true,
  easing = 'ease-out-cubic',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!trigger);
  const ref = useRef<HTMLSpanElement>(null);
  // Stable ref so the animation callback always reads the latest value
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;

  const handleIntersect = useCallback(() => {
    if (!hasStartedRef.current) {
      setHasStarted(true);
    }
  }, []);

  useEffect(() => {
    if (!trigger || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          handleIntersect();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [trigger, handleIntersect]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | undefined;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const rawProgress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeFn = (EASING_MAP[easing] ?? DEFAULT_EASE) as (t: number) => number;
      const easedProgress = easeFn(rawProgress);
      setCount(easedProgress * end);

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, duration, end, easing]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}
