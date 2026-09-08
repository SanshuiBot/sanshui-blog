'use client';
import { useState, useRef, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSafeTimeout } from '@/components/UI/useSafeTimeout';

// 服务端渲染时 useLayoutEffect 会打「does nothing on the server」警告（没有浏览器
// 绘制阶段），退化为 useEffect；客户端用真实 layout effect：在浏览器绘制前同步
// 修正气泡尺寸，首帧定位就用实测宽度，避免宽标签（如「搜索 (Ctrl K)」≈120px）
// 在默认 80×28 判断下先出屏一帧再跳回
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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
 *  - 屏幕右/下边缘自动反转方向，且定位始终钳制在视口内（8px 边距）：
 *    小屏/长文本（如「搜索 (Ctrl K)」）也不会溢出屏幕
 *  - 气泡 createPortal 挂到 document.body：fixed 定位不再受祖先
 *    transform/translate 劫持包含块（Footer 回到顶部按钮曾因此错位出屏）
 *  - 玻璃态背景 + accent 描边，带淡入 + 上浮动画
 *  - 只在鼠标 hover 时显示：mouseenter 后 80ms 显示 / mouseleave 后 60ms
 *    隐藏，避免快速划过闪烁；不做 focus 显示（无鼠标坐标，弹窗关闭后焦点
 *    还原会让气泡粘滞），按钮自身均有 aria-label
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
  // 气泡实际尺寸（渲染期不读 ref）：显示瞬间由 effect 实测，handleMove 动态修正
  const [bubbleSize, setBubbleSize] = useState({ w: 80, h: 28 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  // 最近一次鼠标位置：ref 写入不触发渲染，未显示时只记位置、显示瞬间才同步一次
  const posRef = useRef({ x: 0, y: 0 });
  // 3 个卸载安全的定时器（useSafeTimeout 自动 cleanup，见 ADR-0003）：
  // showTimer / hideTimer 双向 debounce；guardTimer 触屏点击后短暂抑制合成 mouseenter
  const setShowTimer = useSafeTimeout();
  const setHideTimer = useSafeTimeout();
  const setGuardTimer = useSafeTimeout();
  // 触屏守卫：手指点击后短暂抑制浏览器补发的合成 mouseenter（混合设备）
  const touchGuard = useRef(false);
  // 主指针是否有 hover 能力；纯触屏设备（手机/平板）为 false → 不显示气泡。
  // 只在事件回调里读取、不参与渲染，用 ref 即可（避免 effect 内同步 setState 的 lint warning）
  const hoverCapable = useRef(true);

  useEffect(() => {
    // 设备 hover 能力不会中途变化，无需监听 change
    hoverCapable.current = window.matchMedia('(hover: hover)').matches;
  }, []);

  // 气泡显示后立即实测尺寸：默认 80×28 对长文本（如「搜索 (Ctrl K)」）会让
  // 翻转判断/钳制用错尺寸；而鼠标停住不动时 handleMove 不会再来修正，
  // 因此显示瞬间由本 effect 补一次测量。尺寸未变时返回 prev，不触发重渲染。
  // 用 isomorphic layout effect：绘制前完成修正，首帧定位就不出屏
  useIsomorphicLayoutEffect(() => {
    if (!visible || !bubbleRef.current) return;
    const bw = bubbleRef.current.offsetWidth;
    const bh = bubbleRef.current.offsetHeight;
    setBubbleSize((prev) => (prev.w === bw && prev.h === bh ? prev : { w: bw, h: bh }));
  }, [visible]);

  const clearShowHide = useCallback(() => {
    setShowTimer(() => {}, 0); // noop：useSafeTimeout 内部会清上一个未触发 timer
    setHideTimer(() => {}, 0);
  }, [setShowTimer, setHideTimer]);

  const handleEnter = () => {
    if (disabled || !label || !hoverCapable.current || touchGuard.current) return;
    clearShowHide();
    setShowTimer(() => {
      // 显示瞬间按最新鼠标位置定位（ref 常新），避免气泡从 (0,0)/旧位置闪现。
      // 注意要拷贝坐标而非存 ref 引用：handleMove 会原地改写 posRef.current，
      // 若 state 持有同一对象，改写会绕过 setPos 且亚像素守卫永远命中
      // （|x - pos.x| 恒为 0）→ 气泡显示后不再跟随鼠标，也不触发任何重渲染。
      setPos({ x: posRef.current.x, y: posRef.current.y });
      setVisible(true);
    }, 80);
  };

  const handleMove = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    // 原地改写 ref 对象：热路径（导航栏悬停）每事件不分配新对象
    posRef.current.x = x;
    posRef.current.y = y;
    // 未显示时不触发任何 state 更新（此前每次移动都 setPos → 导航栏悬停时高频重渲染）
    if (!visible) return;
    // 亚像素移动不重渲染
    if (Math.abs(x - pos.x) < 0.5 && Math.abs(y - pos.y) < 0.5) return;
    setPos({ x, y });
    // 气泡尺寸只在实测变化时更新，避免每次移动都 setState（label 变化等场景）。
    // 翻转判断不在这里做——渲染期从 state 推导（见下方定位计算）：否则鼠标在
    // 显示定时器（80ms）触发前停住时 flip 永远是 false，小屏右边缘气泡直接出屏
    const bw = bubbleRef.current?.offsetWidth ?? bubbleSize.w;
    const bh = bubbleRef.current?.offsetHeight ?? bubbleSize.h;
    if (bw !== bubbleSize.w || bh !== bubbleSize.h) {
      setBubbleSize({ w: bw, h: bh });
    }
  };

  const handleLeave = () => {
    touchGuard.current = false;
    clearShowHide();
    setHideTimer(() => setVisible(false), 60);
  };

  /** 触屏点击：立即隐藏气泡，并短暂抑制随后的合成 mouseenter（混合设备防残留） */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    touchGuard.current = true;
    clearShowHide();
    setVisible(false);
    setGuardTimer(() => {
      touchGuard.current = false;
    }, 600);
  };

  // 定位计算：仅在气泡可见时读取 window（SSR/隐藏时跳过，left/top 用不到）。
  // 翻转从 state（pos + 实测 bubbleSize）推导，鼠标停住不动时也正确；
  // 末尾 8px 视口钳制兜底：翻转后仍可能出界（气泡比鼠标另一侧剩余空间还宽）。
  let left = 0;
  let top = 0;
  if (visible) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const flipX = pos.x + offsetX + bubbleSize.w > vw - 8;
    const flipY = pos.y + offsetY + bubbleSize.h > vh - 8;
    left = Math.max(
      8,
      Math.min(flipX ? pos.x - offsetX - bubbleSize.w : pos.x + offsetX, vw - bubbleSize.w - 8),
    );
    top = Math.max(
      8,
      Math.min(flipY ? pos.y - offsetY - bubbleSize.h : pos.y + offsetY, vh - bubbleSize.h - 8),
    );
  }

  return (
    <div
      ref={wrapRef}
      className="contents"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMove}
      onPointerDown={handlePointerDown}
    >
      {children}
      {visible &&
        label &&
        // 气泡只在交互后渲染，SSR 首屏不会走到这里；挂到 body 使其脱离
        // 任何带 transform/translate 的祖先，left/top 始终相对视口计算。
        // typeof document 检查保留：用于测试环境模拟 SSR 场景下的安全守卫
        createPortal(
          <div
            ref={bubbleRef}
            role="tooltip"
            className={`fixed z-[60] whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-stone-900 dark:text-fg glass-heavy border border-accent-violet/20 tooltip-fade ${className}`}
            style={{ left, top, pointerEvents: 'none' }}
          >
            {label}
          </div>,
          document.body,
        )}
    </div>
  );
}
