'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  loadTime: number; // Total page load time
}

export function usePerformanceMonitor() {
  const metrics = useRef<Partial<PerformanceMetrics>>({});
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    // FCP - First Contentful Paint
    const fcpEntries = performance.getEntriesByName('first-contentful-paint');
    const fcpEntry = fcpEntries[0] as PerformanceEntry | undefined;
    if (fcpEntry) {
      metrics.current.fcp = fcpEntry.startTime;
    }

    // TTFB - Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.current.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      metrics.current.loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
    }

    // LCP - Largest Contentful Paint
    try {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.current.lcp = lastEntry.startTime;
      });
      observerRef.current.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP not supported:', error);
    }

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0] as any;
        if (firstInput) {
          metrics.current.fid = firstInput.processingStart - firstInput.startTime;
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('FID not supported:', error);
    }

    // CLS - Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        metrics.current.cls = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('CLS not supported:', error);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const getMetrics = useCallback(() => {
    return metrics.current;
  }, []);

  const logMetrics = useCallback(() => {
    console.log('Performance Metrics:', metrics.current);

    // Log performance warnings
    if (metrics.current.fcp && metrics.current.fcp > 1.8) {
      console.warn('⚠️ Slow FCP:', metrics.current.fcp, 'ms (target: < 1.8s)');
    }
    if (metrics.current.lcp && metrics.current.lcp > 2.5) {
      console.warn('⚠️ Slow LCP:', metrics.current.lcp, 'ms (target: < 2.5s)');
    }
    if (metrics.current.fid && metrics.current.fid > 100) {
      console.warn('⚠️ Slow FID:', metrics.current.fid, 'ms (target: < 100ms)');
    }
    if (metrics.current.cls && metrics.current.cls > 0.1) {
      console.warn('⚠️ High CLS:', metrics.current.cls, '(target: < 0.1)');
    }
  }, []);

  return { metrics: metrics.current, getMetrics, logMetrics };
}

// Performance debounce hook
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debounced;
}

// FPS counter hook
export function useFPSCounter() {
  const fpsRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const framesRef = useRef<number>(0);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const countFrames = () => {
      const currentTime = performance.now();
      framesRef.current++;

      const deltaTime = currentTime - lastTimeRef.current;
      if (deltaTime >= 1000) {
        fpsRef.current = Math.round((framesRef.current * 1000) / deltaTime);
        framesRef.current = 0;
        lastTimeRef.current = currentTime;

        if (process.env.NODE_ENV === 'development' && fpsRef.current < 30) {
          console.warn('⚠️ Low FPS detected:', fpsRef.current);
        }
      }

      requestAnimationFrame(countFrames);
    };

    updateIntervalRef.current = setInterval(countFrames, 16); // ~60fps

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const getFPS = useCallback(() => fpsRef.current, []);

  return { getFPS };
}

// Memory usage hook (Chrome only)
export function useMemoryMonitor() {
  const memoryInfo = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const updateMemory = () => {
        memoryInfo.current = (performance as any).memory;

        if (process.env.NODE_ENV === 'development') {
          const usedMB = Math.round(memoryInfo.current.usedJSHeapSize / 1048576);
          const totalMB = Math.round(memoryInfo.current.totalJSHeapSize / 1048576);

          if (usedMB > totalMB * 0.8) {
            console.warn('⚠️ High memory usage:', usedMB, 'MB /', totalMB, 'MB');
          }
        }
      };

      const interval = setInterval(updateMemory, 5000);
      updateMemory(); // Initial check

      return () => clearInterval(interval);
    }
  }, []);

  const getMemoryInfo = useCallback(() => memoryInfo.current, []);

  return { memoryInfo: memoryInfo.current, getMemoryInfo };
}

// Performance optimization utilities
export const perfUtils = {
  // Request animation frame with fallback
  raf(callback: () => void) {
    if (typeof requestAnimationFrame !== 'undefined') {
      return requestAnimationFrame(callback);
    }
    return setTimeout(callback, 16);
  },

  // Cancel animation frame with fallback
  caf(id: number) {
    if (typeof cancelAnimationFrame !== 'undefined') {
      return cancelAnimationFrame(id);
    }
    return clearTimeout(id);
  },

  // Throttle function
  throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    let inThrottle = false;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  // Request idle callback with fallback
  ric(callback: () => void) {
    if (typeof requestIdleCallback !== 'undefined') {
      return requestIdleCallback(callback);
    }
    return setTimeout(callback, 1);
  },

  // Cancel idle callback with fallback
  cic(id: number) {
    if (typeof cancelIdleCallback !== 'undefined') {
      return cancelIdleCallback(id);
    }
    return clearTimeout(id);
  },
};