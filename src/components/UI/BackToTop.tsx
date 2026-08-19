'use client';
import { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Tooltip from '@/components/UI/Tooltip';

interface Props {
  /** 滚动超过该阈值（px）才显示按钮 */
  threshold?: number;
  /** 定位类名：调用方决定挂载位置（Footer 顶部居中 / 文章页左下固定） */
  className?: string;
}

/**
 * 「回到顶部」浮动按钮 —— 全站唯一实现。
 * -----------------------------
 * 之前 Footer 与 PostMeta 各自复制了一份几乎相同的
 * 「scrollY 阈值监听 + Tooltip + 圆钮 + active:scale-95」，
 * 收口后只保留挂载位置（className）与阈值（threshold）两个差异点。
 */
export default function BackToTop({ threshold = 500, className = '' }: Props) {
  const [show, setShow] = useState(false);
  const { scrollY } = useScroll();
  // 与 Navbar/PostMeta 共用同一 useMotionValueEvent 事件循环批次
  useMotionValueEvent(scrollY, 'change', (v) => setShow(v > threshold));

  return (
    <>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={className}
        >
          <Tooltip label="回到顶部">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-2.5 rounded-full bg-surface border border-white/10 text-gray-400 hover:text-white hover:glow-violet transition-all active:scale-95"
              aria-label="回到顶部"
            >
              <ArrowUp size={16} />
            </button>
          </Tooltip>
        </motion.div>
      )}
    </>
  );
}
