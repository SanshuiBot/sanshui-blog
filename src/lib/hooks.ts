'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScroll, useTransform } from 'framer-motion';

export function useMouseMoveTransform() {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return current;
}

export function useDebounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounced = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => func(...args), delay);
  }, [func, delay]);
  return debounced;
}

export function useScrollYProgress() {
  const { scrollYProgress } = useScroll();
  return useTransform(scrollYProgress, [0, 1], [0, 1]);
}

export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement | null>,
  options?: { threshold?: number; rootMargin?: string }
) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry) setIsVisible(entry.isIntersecting); },
      { threshold: options?.threshold || 0.1, rootMargin: options?.rootMargin || '0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);
  return isVisible;
}

export function useParallax(ref: React.RefObject<HTMLElement | null>, speed = 0.5) {
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  return useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
}
