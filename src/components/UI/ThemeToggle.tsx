'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
        className="nav-icon-btn relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 overflow-hidden"
        aria-label="切换主题"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'sun' : 'moon'}
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 14, opacity: 0 }}
            transition={{ duration: 0.08, ease: [0.4, 0, 0.2, 1] }}
            className="block"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </Tooltip>
  );
}
