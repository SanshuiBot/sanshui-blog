'use client';
import { useState, useRef, useEffect, type ReactNode } from 'react';

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
 *
 * 触屏适配（约定：纯触屏设备不显示气泡，混合设备点击后立即隐藏）：
 *  - 触屏点击只触发「模拟 hover」而没有 mouseleave，气泡会粘在屏幕上。
 *    因此无 hover 能力（prefers hover: none）的设备完全不显示气泡——
 *    按钮自身都有 aria-label，无障碍信息不受影响。
 *  - 混合设备（触屏笔记本等）上手指点击时，pointerdown 立即隐藏气泡并
 *    短暂抑制随后的合成 mouseenter，避免气泡闪现残留；鼠标 hover 不受影响。
 */
interface TooltipProps {
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
  // 触屏守卫：手指点击后短暂抑制浏览器补发的合成 mouseenter（混合设备）
  const touchGuard = useRef(false);
  const guardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 主指针是否有 hover 能力；纯触屏设备（手机/平板）为 false → 不显示气泡。
  // 只在事件回调里读取、不参与渲染，用 ref 即可（避免 effect 内同步 setState 的 lint warning）
  const hoverCapable = useRef(true);

  useEffect(() => {
    // 设备 hover 能力不会中途变化，无需监听 change
    hoverCapable.current = window.matchMedia('(hover: hover)').matches;
    return () => {
      if (guardTimer.current) clearTimeout(guardTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  };

  const handleEnter = () => {
    if (disabled || !label || !hoverCapable.current || touchGuard.current) return;
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
    touchGuard.current = false;
    clearTimers();
    hideTimer.current = setTimeout(() => setVisible(false), 60);
  };

  /** 触屏点击：立即隐藏气泡，并短暂抑制随后的合成 mouseenter（混合设备防残留） */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    touchGuard.current = true;
    clearTimers();
    setVisible(false);
    if (guardTimer.current) clearTimeout(guardTimer.current);
    guardTimer.current = setTimeout(() => {
      touchGuard.current = false;
      guardTimer.current = null;
    }, 600);
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
      onPointerDown={handlePointerDown}
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
