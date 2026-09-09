'use client';
import { useEffect, useState } from 'react';

/**
 * 阅读进度百分比指示器 —— 固定在视口右下角，滚动时实时显示。
 * 仅在滚动 > 5% 时显示，避免首屏时遮挡内容。
 */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const current = Math.round((scrollTop / docHeight) * 100);
      setPct(current);
      setVisible(current > 5);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 px-3 py-1.5 rounded-full glass text-xs font-mono text-stone-500 dark:text-gray-400 select-none pointer-events-none"
      aria-hidden="true"
    >
      {pct}%
    </div>
  );
}
