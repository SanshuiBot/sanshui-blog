'use client';

import '@/styles/resume-terminal.css';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { splitResumeLines } from '@/lib/resumeLines';
import { useSafeTimeout } from '@/components/UI/useSafeTimeout';
import TerminalShell from '@/components/UI/TerminalShell';

interface ResumeTerminalProps {
  /** 完整简历文本（markdown，逐字符打字输出） */
  source: string;
  /** 单字符打印间隔（毫秒），默认 8ms */
  charDelay?: number;
  /** 是否在进入视口时才开始打印，默认 true */
  triggerOnView?: boolean;
}

/**
 * 终端式"流式打印"简历模块。
 *
 * - 进入视口后逐字符打字输出（光标跟字移动，模拟真实终端）
 * - 保留行级节奏：标题行前停顿稍长、空行间隔稍短
 * - 支持 markdown 行内高亮：`## 标题` 渲染为紫色高亮，`- 列表项` 渲染为带点列表
 * - 打印中可「跳过」，完成后可「重新播放」（终端命令风格按钮）
 * - 打字动画本身即内容，始终播放，不随 reduced-motion 关闭
 * - 亮/暗双主题：CSS 变量默认亮值，暗色走 resume-terminal.css 的 html.dark 覆盖
 */
export default function ResumeTerminal({
  source,
  charDelay = 8,
  triggerOnView = true,
}: ResumeTerminalProps) {
  const lines = useMemo(() => splitResumeLines(source), [source]);

  // 打字进度：已完整打完的行数 + 当前行已打出的字符数。
  const [doneLines, setDoneLines] = useState(0);
  const [curChars, setCurChars] = useState(0);
  // 跳过态（state 而非 ref：渲染期可读，skip 按钮显隐/观察器短路都用它）
  const [skipped, setSkipped] = useState(false);
  // 实际显示的行数：用户点跳过 → 整篇立即显示（派生值，不走 effect setState）。
  // 注：打字动画本身即内容，不随 reduced-motion 关闭（用户明确要求取消该限制）。
  const visibleLines = skipped ? lines.length : doneLines;
  const done = visibleLines >= lines.length;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  // 是否已启动过打印（ref 守卫：只在 effect / 定时器回调里读写，不进渲染期）
  const startedRef = useRef<boolean>(false);
  // 打字链终止标记：skip 时置位，tick 顶部检查后不再重排定时器
  const stoppedRef = useRef<boolean>(false);
  // 打印链定时器：useSafeTimeout 自动 cleanup（卸载后 setState bug 类，见 ADR-0003）。
  // tick 链用 useSafeTimeout 重排自身——cancel 由 hook 内部管，effect 重挂时不丢。
  const setTickTimer = useSafeTimeout();

  // 打字链：每 tick 打出一个字符。行与行之间按行类型插入停顿，保留原有节奏感。
  // 首字符经 setTickTimer(tick, 0) 异步派发，避免在 effect 内同步 setState。
  const startPrinting = useCallback(() => {
    setDoneLines(0);
    setCurChars(0);
    setSkipped(false);
    startedRef.current = true;
    stoppedRef.current = false;
    let li = 0;
    let ci = 0;
    const tick = () => {
      // skip 已终止打字链：不再重排定时器
      if (stoppedRef.current) return;
      if (li >= lines.length) {
        setDoneLines(lines.length);
        setCurChars(0);
        return;
      }
      const line = lines[li] ?? '';
      ci += 1;
      setDoneLines(li);
      setCurChars(ci);
      if (ci >= line.length) {
        // 当前行打完：行尾停顿（标题行稍慢、空行稍快），再进下一行
        li += 1;
        ci = 0;
        if (li >= lines.length) {
          setDoneLines(lines.length);
          return;
        }
        const trimmed = line.trimStart();
        const pause = trimmed === '' ? 25 : trimmed.startsWith('#') ? 110 : 18;
        setTickTimer(tick, pause);
        return;
      }
      setTickTimer(tick, charDelay);
    };
    setTickTimer(tick, 0);
  }, [lines, charDelay, setTickTimer]);

  // 进入视口后启动打印
  useEffect(() => {
    if (startedRef.current) return;
    if (!triggerOnView) {
      // 异步派发：startPrinting 内有 setState，避免在 effect 体内同步调用（级联渲染告警）
      const id = window.setTimeout(startPrinting, 0);
      return () => window.clearTimeout(id);
    }
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startPrinting();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOnView]);

  // 每次打字进度变化 / 打印完成后滚动到底，模拟终端追加。
  // 注意不能在 tick 里同步设 scrollTop：那时 React 还没提交新字符，
  // scrollHeight 是旧值，最终会差一行/把完成提示留在可视区外。
  useEffect(() => {
    const body = scrollBodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [visibleLines, curChars, done]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="resume-terminal"
    >
      <TerminalShell title="sanshui@blog ~/resume" status="streaming…">
        {/* 终端主体 */}
        <div
          ref={scrollBodyRef}
          className="resume-body font-mono text-[13px] leading-relaxed p-5 h-[460px] overflow-y-auto"
        >
          <div className="resume-prompt mb-2">$ cat resume.md</div>
          <div className="space-y-0.5">
            {lines.slice(0, visibleLines).map((line, i) => (
              <ResumeLine key={i} line={line} />
            ))}
            {/* 当前行：打字中逐字符追加，光标内嵌行尾跟随字符推进（含行间空档）。
                打字未启动时不渲染（避免空行里闪光标）；打字进行中才显示 */}
            {!done && lines[doneLines] !== undefined && (doneLines > 0 || curChars > 0) && (
              <ResumeLine line={(lines[doneLines] ?? '').slice(0, curChars)} typing />
            )}
          </div>

          {done && (
            <div className="resume-done mt-4 pt-3 border-t flex items-center justify-between gap-3">
              <span>
                <span className="resume-done-icon">✓</span> 简历打印完成 · 共 {lines.length} 行
              </span>
              <button
                type="button"
                onClick={() => {
                  startPrinting();
                }}
                className="resume-replay-btn shrink-0 font-mono text-xs px-3 py-1 rounded-md border cursor-pointer"
                aria-label="重新播放简历打字动画"
              >
                ↻ 重新播放
              </button>
            </div>
          )}

          {/* skip 按钮：打字进行中显示（未启动时 doneLines=0 且 curChars=0 自然隐藏） */}
          {!done && (doneLines > 0 || curChars > 0) && (
            <div className="mt-4 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  // 终止打字链（停止空转渲染）+ 立即全量呈现（visibleLines 派生为整篇）
                  stoppedRef.current = true;
                  setSkipped(true);
                  setCurChars(0);
                }}
                className="resume-replay-btn font-mono text-xs px-3 py-1 rounded-md border cursor-pointer"
                aria-label="跳过打字动画，直接显示完整简历"
              >
                » 跳过动画
              </button>
            </div>
          )}
        </div>
      </TerminalShell>
    </motion.div>
  );
}

/**
 * 单行简历渲染（memo：打字期父组件每字符 tick 重渲染一次，
 * 已打完的行 props 不变，跳过重渲染与 markdown 重新解析）：
 * - `# / ## / ###` 标题行：放大、紫色
 * - `- xxx` 列表项：渲染为带圆点的项
 * - `> xxx` 引用：渲染为带左边框的引用
 * - `---` 分隔线：渲染为 hr
 * - 其余：普通文本，`**粗体**` 与 `` `代码` `` 做行内高亮
 */
const ResumeLine = memo(function ResumeLine({ line, typing }: { line: string; typing?: boolean }) {
  const trimmed = line.trimStart();
  // 打字光标：内嵌在当前行内容末尾，随字符推进（memo 对已完成行 props 不变仍跳过渲染）
  const cursor = typing ? (
    <span className="resume-cursor inline-block w-2 h-4 align-middle ml-0.5 animate-pulse" />
  ) : null;

  // 分隔线：光标独占一行显示
  if (trimmed === '---') {
    return typing ? (
      <div className="resume-hr-line my-3">{cursor}</div>
    ) : (
      <hr className="resume-hr my-3" />
    );
  }

  // 标题
  const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
  if (headingMatch) {
    const level = headingMatch[1]?.length ?? 1;
    const text = headingMatch[2] ?? '';
    const sizeMap: Record<number, string> = {
      1: 'text-lg',
      2: 'text-base',
      3: 'text-sm',
      4: 'text-sm',
      5: 'text-xs',
      6: 'text-xs',
    };
    const size = sizeMap[level] ?? 'text-sm';
    return (
      <div className={`resume-heading mt-3 mb-1 font-semibold ${size}`}>
        <InlineText text={text} />
        {cursor}
      </div>
    );
  }

  // 引用
  if (trimmed.startsWith('>')) {
    const text = trimmed.replace(/^>\s?/, '');
    return (
      <div className="resume-quote my-2 pl-3 italic">
        <InlineText text={text} />
        {cursor}
      </div>
    );
  }

  // 列表项
  if (trimmed.startsWith('- ')) {
    const text = trimmed.slice(2);
    return (
      <div className="resume-list flex gap-2">
        <span className="resume-list-marker select-none">•</span>
        <span className="flex-1">
          <InlineText text={text} />
          {cursor}
        </span>
      </div>
    );
  }

  // 空行
  if (trimmed === '') {
    return typing ? <div className="h-2 relative">{cursor}</div> : <div className="h-2" />;
  }

  // 普通行
  return (
    <div className="resume-text">
      <InlineText text={line} />
      {cursor}
    </div>
  );
});

/**
 * 行内文本：解析 `**粗体**` 与 `` `代码` `` 两种标记。
 */
function InlineText({ text }: { text: string }) {
  const parts = useMemo(() => parseInline(text), [text]);
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === 'bold') {
          return (
            <strong key={i} className="resume-bold font-semibold">
              {p.content}
            </strong>
          );
        }
        if (p.type === 'code') {
          return (
            <code key={i} className="resume-code px-1.5 py-0.5 mx-0.5 rounded border">
              {p.content}
            </code>
          );
        }
        return <span key={i}>{p.content}</span>;
      })}
    </>
  );
}

type InlinePart = { type: 'text' | 'bold' | 'code'; content: string };

function parseInline(text: string): InlinePart[] {
  const result: InlinePart[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**')) {
      result.push({ type: 'bold', content: token.slice(2, -2) });
    } else {
      result.push({ type: 'code', content: token.slice(1, -1) });
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    result.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return result;
}
