'use client';
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import Tooltip from '@/components/UI/Tooltip';

interface Props {
  /** 滚动超过该阈值（px）才显示按钮 */
  threshold?: number;
  /** 定位类名：调用方决定挂载位置（现仅 Footer 顶部居中一处；文章页回顶已并入 ReadingProgress 环形按钮，见 AGENTS.md #51） */
  className?: string;
}

/**
 * 「回到顶部」浮动按钮 —— 全站唯一实现。
 * -----------------------------
 * 之前 Footer 与 PostMeta 各自复制了一份几乎相同的
 * 「scrollY 阈值监听 + Tooltip + 圆钮 + active:scale-95」，
 * 收口后只保留挂载位置（className）与阈值（threshold）两个差异点。
 *
 * 入场动画走 CSS（.backtotop-fade-in，globals.css），不依赖 framer-motion——
 * framer-motion 已移出首屏 layout，只随懒加载 chunk 进入。
 */
export default function BackToTop({ threshold = 500, className = '' }: Props) {
  const [show, setShow] = useState(false);
  // 原生 passive scroll listener（替代 framer useScroll/useMotionValueEvent）；
  // 同值 setState React 自动 bail-out，只跨阈值时触发一次重渲染
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return (
    <>
      {show && (
        <div className={`${className} backtotop-fade-in`}>
          <Tooltip label="回到顶部">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-2.5 rounded-full bg-white border border-black/10 text-stone-600 hover:text-stone-900 dark:bg-stone-100 dark:border-stone-200 dark:text-stone-600 dark:hover:text-stone-900 hover:glow-violet transition-all active:scale-95"
              aria-label="回到顶部"
            >
              <ArrowUp size={16} />
            </button>
          </Tooltip>
        </div>
      )}
    </>
  );
}
