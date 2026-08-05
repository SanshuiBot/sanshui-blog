'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import Tooltip from '@/components/UI/Tooltip';

/** hydration 完成检测：客户端快照 true、SSR 快照 false（替代 mounted effect，避免 setState-in-effect） */
const subscribeMounted = () => () => {};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeMounted,
    () => true,
    () => false,
  );
  if (!mounted) return <div className="p-2 w-9 h-9" />;

  const isDark = theme === 'dark';
  return (
    <Tooltip label={isDark ? '切换到亮色' : '切换到暗色'}>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        aria-label="切换主题"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </Tooltip>
  );
}
