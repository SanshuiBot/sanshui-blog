'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSyncExternalStore } from 'react';
import Tooltip from '@/components/UI/Tooltip';

/** hydration 完成检测：客户端快照 true、SSR 快照 false（替代 mounted effect，避免 setState-in-effect） */
const subscribeMounted = () => () => {};

/**
 * 主题切换：亮 / 暗 二态。
 * -----------------------------
 * 站点无「跟随系统」档（Providers 设 defaultTheme="light" + enableSystem={false}，
 * 存储值只可能是 light/dark），因此 `theme` 即实际主题，直接判断即可——
 * 旧实现曾以 theme==='dark' 判暗，在默认 system 时恒 false 导致图标/文案
 * 与页面实际明暗不一致，已随 system 档一并移除。
 *
 * 首点无反应修复：SSR 快照下（mounted=false）本组件原渲染无交互的占位 div，
 * 移动端 hydration 完成前的首次点击会落在占位 div 上而「无反应」。故这里始终渲染
 * 稳定锚点 <span id="theme-toggle">（display:contents 不占布局）：hydration 前由
 * layout 内联的原生事件委托脚本代劳切主题（脚本见 themeToggleClickScript），
 * React 接管后脚本检测 #theme-toggle 内已出现真实 <button> 即自动让位，不重复切换。
 *
 * 图标动画由 AnimatePresence 接管（亮暗各一态）。
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeMounted,
    () => true,
    () => false,
  );

  const isDark = theme === 'dark';
  // mount 前（含 SSR 首帧）theme 读不到 localStorage，SSR/客户端可能判出不同明暗，
  // 故图标与 aria-label 在 mount 前统一用中性值兜底，避免 hydration mismatch。
  const label = mounted ? (isDark ? '切换到亮色' : '切换到暗色') : '切换主题';

  return (
    <div id="theme-toggle" className="contents">
      {mounted ? (
        <Tooltip label={label}>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="nav-icon-btn relative p-2 w-9 h-9 flex items-center justify-center rounded-xl text-stone-600 hover:text-stone-900 hover:bg-black/[0.03] dark:text-gray-400 dark:hover:text-fg dark:hover:bg-white/5 overflow-hidden"
            aria-label={label}
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
      ) : (
        <div className="p-2 w-9 h-9" />
      )}
    </div>
  );
}
