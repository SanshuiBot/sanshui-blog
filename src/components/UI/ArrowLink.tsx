'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ReactNode, MouseEventHandler } from 'react';

interface ArrowLinkProps {
  href: string;
  /** 方向：back = 「返回 X」左箭头左移；more = 「查看全部 X」右箭头右移 */
  dir: 'back' | 'more';
  /** 透传给 <Link> 的类名（.link-back / .link-more 及布局类） */
  className?: string;
  /** 透传给 <Link>：文章详情跳转时配合 startNavigation 使用 */
  prefetch?: boolean;
  /** 透传给 <Link>：文章详情跳转时配合 startNavigation 使用 */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** 链接文字 */
  children: ReactNode;
}

/**
 * 「返回 X / 查看全部 X / 阅读全文」箭头链接。
 *
 * 箭头位移动画由 Framer variants 驱动（JS rAF + inline style，whileHover 挂在外层、
 * 箭头 variants 响应），绕开 CSS transition 被 prefers-reduced-motion 全局规则
 * 压制的问题（与 PostCard 标题位移同款方案）；hover 变色仍走 .link-back/.link-more
 * 纯 CSS，主题切换不失响应（AGENTS.md #24）。
 */
export default function ArrowLink({
  href,
  dir,
  className = '',
  prefetch,
  onClick,
  children,
}: ArrowLinkProps) {
  const Icon = dir === 'back' ? ArrowLeft : ArrowRight;
  const shift = dir === 'back' ? -3 : 3;
  const arrow = (
    <motion.span
      variants={{ idle: { x: 0 }, hovered: { x: shift } }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="inline-flex"
    >
      <Icon size={14} className="link-arrow" />
    </motion.span>
  );
  // back：箭头在文字左侧（向左移）；more：箭头在文字右侧（向右移）
  return (
    <motion.div initial="idle" whileHover="hovered" className="inline-block">
      <Link href={href} prefetch={prefetch} onClick={onClick} className={className}>
        {dir === 'back' ? (
          <>
            {arrow}
            {children}
          </>
        ) : (
          <>
            {children}
            {arrow}
          </>
        )}
      </Link>
    </motion.div>
  );
}
