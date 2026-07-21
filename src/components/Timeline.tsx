'use client';

import { useEffect, useState, useRef } from 'react';

interface TimelineProps {
  events: Array<{
    year: string;
    title: string;
    description: string;
    side?: 'left' | 'right';
    /** Optional icon or emoji */
    icon?: string;
  }>;
}

export default function Timeline({ events }: TimelineProps) {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile on client only
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  // Observe visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            setVisibleIndices((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );

    const els = containerRef.current?.querySelectorAll('[data-index]');
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [events.length]);

  // Fade in all events after mount
  useEffect(() => {
    setVisibleIndices(new Set(events.map((_, i) => i)));
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="flex justify-center py-16 text-sm text-stone-400 dark:text-stone-600">
        暂无事件
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Center line */}
      <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
        <div
          className="absolute inset-0 w-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, #f472b6, #c084fc, #60a5fa, transparent)',
            backgroundSize: '100% 200%',
            animation: 'gradient-shift 6s ease infinite',
          }}
        />
      </div>

      <div className="space-y-12">
        {events.map((event, i) => {
          const isLeft = event.side === 'right' ? false : i % 2 === 0;
          // On mobile, always align cards to the right of the line
          const effectiveLeft = isMobile ? false : isLeft;
          const isVisible = visibleIndices.has(i);

          return (
            <div
              key={i}
              data-index={i}
              className={`relative pl-16 sm:pl-0 ${effectiveLeft ? 'sm:text-right' : 'sm:text-left'}`}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? 'translateX(0)'
                  : `translateX(${effectiveLeft ? '-40px' : '40px'})`,
                transition: `all 0.6s var(--ease-out-expo) ${i * 0.1}s`,
              }}
            >
              {/* Node dot */}
              <div className="absolute left-0 sm:left-1/2 top-6 w-3 h-3 -translate-x-1.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 z-10">
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
                  style={{
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Icon badge */}
              {event.icon && (
                <div className="absolute left-0 sm:left-1/2 top-5 w-5 h-5 -translate-x-[11px] text-xs flex items-center justify-center z-20">
                  {event.icon}
                </div>
              )}

              {/* Card */}
              <div className={`w-[calc(50%-2rem)] prism-border ${effectiveLeft ? 'sm:ml-auto' : 'sm:mr-auto'}`}>
                <div className="p-5 glass-refract rounded-2xl">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold holo-text mb-2">
                    {event.year}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 mb-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
