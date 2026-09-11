'use client';
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import Tooltip from '@/components/UI/Tooltip';
import { isBodyScrollLocked } from '@/components/UI/useIsBodyScrollLocked';

// 环形进度 SVG 参数（viewBox 36×36）
const R = 15.5;
const CIRC = 2 * Math.PI * R; // ≈ 97.4，stroke-dasharray 周长

/**
 * 阅读进度 + 回顶按钮（合并控件）—— 固定在视口右下角的环形按钮。
 * -----------------------------
 * 合并前：ReadingProgress（右下百分比徽标）与 PostMeta 的 BackToTop（左下圆钮）
 * 各占一角；合并后单元素承担两种语义：
 *  - 外圈环形弧线 = 阅读进度（accent 三色渐变描边，12 点方向顺时针）
 *  - 圆心「↑ 箭头 + 百分比」常显；整圆点击平滑回顶（悬停 Tooltip 提示）
 *  - 滚动 > 400px 才出现（回顶语义阈值，复用原 BackToTop 的 threshold）
 *  - 弹层滚动锁定期冻结进度（沿用「进度条清空」修复的判锁基元）
 *  - z-30 低于抽屉(z-40)/搜索弹窗(z-[80])，与旧徽标同层
 *  - 入场淡入走 .backtotop-fade-in（globals.css，reduced-motion 全局压制自动合规）
 */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // 滚动锁生效期间 scrollY 被重置（iOS fixed 锁）→ 冻结上次进度，
      // 否则打开弹窗/抽屉时进度环瞬间清零（用户反馈的历史 bug）。
      // 必须**同步读 DOM** 判锁（isBodyScrollLocked）：iOS 把 scrollY 重置为 0
      // 的 scroll 事件发生在 DOM 变更之后、React 状态更新/effect flush 之前，
      // 用 effect 同步的 ref 会晚一拍读到旧锁态 → 竞态清零（review 发现的坑）。
      if (isBodyScrollLocked()) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      setPct(Math.round((scrollTop / docHeight) * 100));
      setShow(scrollTop > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30 backtotop-fade-in">
      <Tooltip label="回到顶部">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="回到顶部"
          className="relative w-11 h-11 rounded-full bg-white border border-black/10 text-stone-600 hover:text-stone-900 dark:bg-stone-100 dark:border-stone-200 dark:text-stone-600 dark:hover:text-stone-900 hover:glow-violet transition-all active:scale-95"
        >
          {/* 进度环：轨道 + accent 渐变弧（dashoffset 随 pct 缩短） */}
          <svg
            viewBox="0 0 36 36"
            className="absolute inset-0 h-full w-full -rotate-90"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="reading-ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent-pink-rgb))" />
                <stop offset="50%" stopColor="rgb(var(--accent-violet-rgb))" />
                <stop offset="100%" stopColor="rgb(var(--accent-blue-rgb))" />
              </linearGradient>
            </defs>
            <circle
              cx="18"
              cy="18"
              r={R}
              fill="none"
              strokeWidth="3"
              className="stroke-black/5 dark:stroke-white/10"
            />
            <circle
              cx="18"
              cy="18"
              r={R}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              stroke="url(#reading-ring-grad)"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - pct / 100)}
            />
          </svg>
          {/* 圆心内容：↑ 箭头 + 百分比 */}
          <span className="relative flex flex-col items-center justify-center leading-none">
            <ArrowUp size={12} strokeWidth={2.5} />
            <span className="mt-0.5 font-mono text-[11px] tabular-nums">{pct}%</span>
          </span>
        </button>
      </Tooltip>
    </div>
  );
}
