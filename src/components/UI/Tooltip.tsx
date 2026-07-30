'use client';
import { useState, useRef, type ReactNode } from 'react';

/**
 * Tooltip —— 跟随鼠标的悬停提示
 * -----------------------------
 * 用于给「无文本的可点击按钮」补一个好看的 hover 提示。
 * 气泡 position:fixed 跟随鼠标坐标，显示在鼠标右下方，不会挡住图标本身。
 *
 * 用法：
 *   <Tooltip label="搜索">
 *     <button aria-label="搜索"><Search /></button>
 *   </Tooltip>
 *
 * 特性：
 *  - 跟随鼠标：onMouseMove 实时更新气泡坐标
 *  - 显示在鼠标右下方（offsetX=14, offsetY=14），避开图标
 *  - 屏幕右/下边缘自动反转方向
 *  - 玻璃态背景 + accent 描边，带淡入 + 上浮动画
 *  - hover/focus 显示，延迟 80ms 显示 / 60ms 隐藏，避免快速划过闪烁
 */
export interface TooltipProps {
  /** 提示文本 */
  label: string;
  /** 子元素（被包裹的按钮） */
  children: ReactNode;
  /** 是否禁用提示 */
  disabled?: boolean;
  /** 额外类名（加到气泡上） */
  className?: string;
  /** 气泡相对鼠标的横向偏移 */
  offsetX?: number;
  /** 气泡相对鼠标的纵向偏移 */
  offsetY?: number;
}

export default function Tooltip({
  label,
  children,
  disabled = false,
  className = '',
  offsetX = 14,
  offsetY = 14,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  };

  const handleEnter = () => {
    if (disabled || !label) return;
    clearTimers();
    showTimer.current = setTimeout(() => setVisible(true), 80);
  };

  const handleMove = (e: React.MouseEvent) => {
    if (!visible) {
      // 首次移动时先按当前坐标定位，避免气泡闪在 (0,0)
      setPos({ x: e.clientX, y: e.clientY });
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    setPos({ x, y });
    // 边缘检测：右边/下边空间不足则翻转
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = bubbleRef.current?.offsetWidth ?? 80;
    const bh = bubbleRef.current?.offsetHeight ?? 28;
    setFlipX(x + offsetX + bw > vw - 8);
    setFlipY(y + offsetY + bh > vh - 8);
  };

  const handleLeave = () => {
    clearTimers();
    hideTimer.current = setTimeout(() => setVisible(false), 60);
  };

  const left = flipX ? pos.x - offsetX - (bubbleRef.current?.offsetWidth ?? 80) : pos.x + offsetX;
  const top = flipY ? pos.y - offsetY - (bubbleRef.current?.offsetHeight ?? 28) : pos.y + offsetY;

  return (
    <div
      ref={wrapRef}
      className="contents"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMove}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {visible && label && (
        <div
          ref={bubbleRef}
          role="tooltip"
          className={`fixed z-[60] whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-white glass-heavy border border-accent-violet/20 shadow-soft tooltip-fade ${className}`}
          style={{ left, top, pointerEvents: 'none' }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
