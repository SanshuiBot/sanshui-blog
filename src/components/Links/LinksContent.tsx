'use client';
import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import ArrowLink from '@/components/UI/ArrowLink';
import Github from '@/components/UI/GithubIcon';
import TerminalShell from '@/components/UI/TerminalShell';
import { siteConfig } from '@/lib/site';
import { friendLinks } from '@/lib/links';
import type { FriendLink } from '@/lib/links';
import '@/styles/terminal-links.css';

// ── 变体 ─────────────────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};
// 命令提示行逐字打出
const promptChars = '~ ❯ ls ~/friends';

// ── 磁吸元素类型契约 ──────────────────────────────────────────────────────────
interface MagneticElement extends HTMLElement {
  __unmount?: () => void;
}

// ── 磁吸光晕：读取 CSS 变量 --mx / --my 并随鼠标更新 ───────────────────────
function attachMagneticGlow(el: HTMLElement | null) {
  if (!el) return;
  const handler = (e: MouseEvent) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  el.addEventListener('mousemove', handler);
  // 鼠标离开时复位，让渐变消失
  el.addEventListener('mouseleave', () => {
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
  });
  // 记录 cleanup（供 React 卸载时调用，避免泄漏）
  (el as MagneticElement).__unmount = () => {
    el.removeEventListener('mousemove', handler);
    el.removeEventListener('mouseleave', handler);
  };
}

// ── 直接拼 /favicon.svg 路径，无需第三方 API ─────────────────────────────────
function getFaviconUrl(url: string): string {
  return `${url}favicon.svg`;
}

// ── 卡片 ─────────────────────────────────────────────────────────────────────
function LinkCard({
  link,
  index,
  ref,
}: {
  link: FriendLink;
  index: number;
  ref?: (el: HTMLElement | null) => void;
}) {
  const dotColor = link.color ?? 'rgb(var(--accent-violet-rgb))';
  const faviconUrl = link.faviconUrl ?? getFaviconUrl(link.url);
  const [faviconErr, setFaviconErr] = useState(false);

  return (
    <motion.a
      ref={ref}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      variants={item}
      className="terminal-link-card"
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      {/* 磁吸光晕层 */}
      <div className="terminal-card-glow" />
      {/* 边框发光层 */}
      <div className="terminal-card-border-glow" />

      {/* 彩色圆点 */}
      <span className="terminal-card-dot" style={{ background: dotColor, color: dotColor }} />

      {/* 图标区：自定义图标 > favicon > Globe */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative">
        {link.icon ? (
          <link.icon size={13} className="opacity-60" />
        ) : (
          <>
            {/* 外部 favicon：静态导出无优化器，用原生 img + state 降级，符合约定 #33/#34 */}
            {/* favicon 加载失败时 display:none 释放占位，Globe 兜底（仅此时渲染，避免盖住已加载的图标） */}
            {/* loading="eager"：显式退出 Chromium 懒加载干预（该干预会推迟视口外图片的 load/error 事件），保证 onError 降级立即触发 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconUrl}
              alt=""
              loading="eager"
              fetchPriority="low"
              className="w-4 h-4 opacity-60 rounded-sm object-contain"
              style={faviconErr ? { display: 'none' } : undefined}
              onError={() => setFaviconErr(true)}
            />
            {faviconErr && <Globe size={13} className="opacity-40 absolute inset-0 m-auto" />}
          </>
        )}
      </div>

      {/* 文字信息 */}
      <div className="terminal-card-info">
        <span className="terminal-card-name-row">
          {link.name}
          <svg
            className="terminal-card-arrow"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </span>
        <p className="terminal-card-desc">{link.desc}</p>
      </div>
    </motion.a>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function LinksContent() {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const promptRef = useRef<HTMLDivElement>(null);
  const charIndexRef = useRef(0);
  const typeTimerRef = useRef<number>(0);

  // 挂载：绑定每张卡片的磁吸追踪
  useEffect(() => {
    const els = cardRefs.current;
    els.forEach(attachMagneticGlow);
    return () => {
      els.forEach((el) => {
        (el as MagneticElement)?.__unmount?.();
      });
    };
  }, []);

  // 挂载：命令提示行打字机效果
  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.textContent = '';
    charIndexRef.current = 0;

    const tick = () => {
      if (charIndexRef.current < promptChars.length) {
        el.textContent += promptChars[charIndexRef.current++];
        typeTimerRef.current = window.setTimeout(tick, 42);
      }
    };
    typeTimerRef.current = window.setTimeout(tick, 400);
    return () => clearTimeout(typeTimerRef.current);
  }, []);

  return (
    <>
      <ArrowLink
        href="/"
        dir="back"
        className="link-back inline-flex items-center gap-1.5 text-sm mb-8"
      >
        返回首页
      </ArrowLink>

      {/* 页面标题 */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          友链
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          <span className="text-aurora">友情链接</span>
        </h1>
        <p className="mt-3 text-gray-500">那些人，那些事</p>
      </div>

      {/* 终端窗口 */}
      <TerminalShell title="sanshui@blog ~/friends">
        <div className="terminal-body">
          {/* 命令提示行 */}
          <div className="terminal-prompt-line">
            <span className="terminal-prompt-symbol">❯</span>
            <span ref={promptRef} />
          </div>

          {/* Bento 网格 */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="terminal-grid"
          >
            {friendLinks.map((link, i) => (
              <LinkCard
                key={link.url}
                link={link}
                index={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
              />
            ))}
          </motion.div>
        </div>
      </TerminalShell>

      {/* 交换友链 CTA（终端风格，置于终端窗口下方） */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="terminal-exchange-box mt-6"
      >
        <div className="terminal-exchange-title">$ cat exchange.md</div>
        <p className="terminal-exchange-desc">想交换友链？在 GitHub 提 Issue 或发邮件。</p>
        <div className="flex flex-wrap gap-3">
          <motion.a
            href={siteConfig.emailHref}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium font-mono"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            联系我
          </motion.a>
          <motion.a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm font-medium border border-white/10 font-mono"
          >
            <Github size={13} />
            GitHub
          </motion.a>
        </div>
      </motion.div>
    </>
  );
}
