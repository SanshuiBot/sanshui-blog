'use client';
import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import ArrowLink from '@/components/UI/ArrowLink';
import Github from '@/components/UI/GithubIcon';
import TerminalShell from '@/components/UI/TerminalShell';
import SpotlightTilt from '@/components/UI/SpotlightTilt';
import { siteConfig } from '@/lib/site';
import { friendLinks } from '@/lib/links';
import type { FriendLink } from '@/lib/links';
import '@/styles/terminal-links.css';
import '@/styles/spotlight.css';

// ── 变体 ─────────────────────────────────────────────────────────────────────
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.02 },
  },
};
const item: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};
// 命令提示行逐字打出
const promptChars = '~ ❯ ls ~/friends';

// ── 卡片 ─────────────────────────────────────────────────────────────────────
// hover 3D tilt + 聚光坐标分发收口 SpotlightTilt（同 PostCard/项目卡/上下篇卡，全站统一）。
// 原手写磁吸光晕绑定（attachMagneticGlow）已由 SpotlightTilt 的坐标分发取代。
function LinkCard({ link }: { link: FriendLink }) {
  const dotColor = link.color ?? 'rgb(var(--accent-violet-rgb))';
  const [faviconErr, setFaviconErr] = useState(false);

  return (
    <motion.div variants={item}>
      <SpotlightTilt
        dyedSelector=".terminal-card-name-row, .terminal-card-desc"
        className="h-full"
        tiltClassName="h-full"
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="terminal-link-card spotlight-card h-full"
        >
          {/* 光晕层 + 边框发光层（公共收口 styles/spotlight.css，色源走共享默认 violet；
              半透明卡面，两层排内容之前即可透出） */}
          <div className="spotlight-glow" aria-hidden="true" />
          <div className="spotlight-border-glow" aria-hidden="true" />

          {/* 彩色圆点 */}
          <span className="terminal-card-dot" style={{ background: dotColor, color: dotColor }} />

          {/* 图标区：自定义 icon > 显式配置的 faviconUrl > 默认 Globe。
              不自动拼 /favicon.svg 抓取外部图标——省请求数（2026-09 调整） */}
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative">
            {link.icon ? (
              <link.icon size={13} className="opacity-60" />
            ) : link.faviconUrl ? (
              <>
                {/* 显式配置的 favicon：静态导出无优化器，用原生 img + state 降级，符合约定 #33/#34 */}
                {/* favicon 加载失败时 display:none 释放占位，Globe 兜底（仅此时渲染，避免盖住已加载的图标） */}
                {/* loading="eager"：显式退出 Chromium 懒加载干预（该干预会推迟视口外图片的 load/error 事件），保证 onError 降级立即触发 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={link.faviconUrl}
                  alt=""
                  loading="eager"
                  fetchPriority="low"
                  className="w-4 h-4 opacity-60 rounded-sm object-contain"
                  style={faviconErr ? { display: 'none' } : undefined}
                  onError={() => setFaviconErr(true)}
                />
                {faviconErr && <Globe size={13} className="opacity-40 absolute inset-0 m-auto" />}
              </>
            ) : (
              <Globe size={13} className="opacity-40" />
            )}
          </div>

          {/* 文字信息 */}
          <div className="terminal-card-info">
            <span className="terminal-card-name-row spotlight-dye">
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
            <p className="terminal-card-desc spotlight-dye">{link.desc}</p>
          </div>
        </a>
      </SpotlightTilt>
    </motion.div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function LinksContent() {
  const promptRef = useRef<HTMLDivElement>(null);
  const charIndexRef = useRef(0);
  const typeTimerRef = useRef<number>(0);

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
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight dark:text-fg">
          <span className="text-aurora">友情链接</span>
        </h1>
        <p className="mt-3 text-stone-500 dark:text-gray-500">那些人，那些事</p>
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
            {friendLinks.map((link) => (
              <LinkCard key={link.url} link={link} />
            ))}
          </motion.div>
        </div>
      </TerminalShell>

      {/* 交换友链 CTA（终端风格，置于终端窗口下方） */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.28 }}
        className="terminal-exchange-box"
      >
        <div className="terminal-exchange-title">$ cat exchange.md</div>
        <p className="terminal-exchange-desc">想交换友链？发邮件或在 GitHub 提 Issue。</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={siteConfig.emailHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-solid btn-terminal text-sm font-medium font-mono btn-hover-scale"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
          </a>
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-terminal bg-black/[0.03] text-stone-700 text-sm font-medium border border-black/[0.1] font-mono dark:bg-white/5 dark:text-gray-300 dark:border-white/10 btn-hover-scale"
          >
            <Github size={14} />
            GitHub
          </a>
        </div>
      </motion.div>
    </>
  );
}
