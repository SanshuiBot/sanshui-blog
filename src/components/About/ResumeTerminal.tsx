'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { splitResumeLines } from '@/lib/resumeLines';

interface ResumeTerminalProps {
  /** 完整简历文本（markdown，按行流式输出） */
  source: string;
  /** 单行打印间隔（毫秒），默认 60ms */
  lineDelay?: number;
  /** 是否在进入视口时才开始打印，默认 true */
  triggerOnView?: boolean;
}

/**
 * 终端式"流式打印"简历模块。
 *
 * - 进入视口后逐行"打印"简历，最后一行打印完毕时显示完成提示
 * - 支持 markdown 行内高亮：`## 标题` 渲染为紫色高亮，`- 列表项` 渲染为带点列表
 * - 打印过程中底部出现闪烁光标，结束后转为静态展示
 * - 通过 CSS 变量 + html:not(.dark) 适配亮/暗双主题
 */
export default function ResumeTerminal({
  source,
  lineDelay = 60,
  triggerOnView = true,
}: ResumeTerminalProps) {
  const lines = useMemo(() => splitResumeLines(source), [source]);

  const [printedLines, setPrintedLines] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef<boolean>(false);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);

  // 进入视口后启动打印
  useEffect(() => {
    if (!triggerOnView) {
      startPrinting();
      return;
    }
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            startPrinting();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOnView]);

  function startPrinting() {
    let idx = 0;
    const tick = () => {
      idx += 1;
      setPrintedLines(idx);
      // 自动滚动到底部，模拟终端追加
      if (scrollBodyRef.current) {
        scrollBodyRef.current.scrollTop = scrollBodyRef.current.scrollHeight;
      }
      if (idx >= lines.length) {
        setDone(true);
        return;
      }
      // 空行稍快、标题行稍慢，营造节奏感
      const current = lines[idx - 1] ?? '';
      const isHeading = current.trimStart().startsWith('#');
      const isEmpty = current.trim() === '';
      const next = isEmpty ? lineDelay * 0.4 : isHeading ? lineDelay * 2.4 : lineDelay;
      window.setTimeout(tick, next);
    };
    tick();
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="resume-terminal rounded-2xl border overflow-hidden shadow-2xl"
    >
      {/* 标题栏 */}
      <div className="resume-titlebar flex items-center gap-2 px-4 py-3 border-b">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs font-mono resume-titlebar-text">sanshui@blog: ~/resume</span>
        <span className="ml-auto text-[11px] font-mono resume-titlebar-status">streaming…</span>
      </div>

      {/* 终端主体 */}
      <div
        ref={scrollBodyRef}
        className="resume-body font-mono text-[13px] leading-relaxed p-5 h-[460px] overflow-y-auto"
      >
        <div className="resume-prompt mb-2">$ cat resume.md</div>
        <div className="space-y-0.5">
          {lines.slice(0, printedLines).map((line, i) => (
            <ResumeLine key={i} line={line} />
          ))}
        </div>

        {/* 闪烁光标 */}
        <span
          className={`resume-cursor inline-block w-2 h-4 align-middle ml-1 ${
            done ? 'resume-cursor-done' : 'animate-pulse'
          }`}
        />

        {done && (
          <div className="resume-done mt-4 pt-3 border-t">
            <span className="resume-done-icon">✓</span> 简历打印完成 · 共 {lines.length} 行
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 单行简历渲染：
 * - `# / ## / ###` 标题行：放大、紫色
 * - `- xxx` 列表项：渲染为带圆点的项
 * - `> xxx` 引用：渲染为带左边框的引用
 * - `---` 分隔线：渲染为 hr
 * - 其余：普通文本，`**粗体**` 与 `` `代码` `` 做行内高亮
 */
function ResumeLine({ line }: { line: string }) {
  const trimmed = line.trimStart();

  // 分隔线
  if (trimmed === '---') {
    return <hr className="resume-hr my-3" />;
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
      </div>
    );
  }

  // 引用
  if (trimmed.startsWith('>')) {
    const text = trimmed.replace(/^>\s?/, '');
    return (
      <div className="resume-quote my-2 pl-3 italic">
        <InlineText text={text} />
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
        </span>
      </div>
    );
  }

  // 空行
  if (trimmed === '') {
    return <div className="h-2" />;
  }

  // 普通行
  return (
    <div className="resume-text">
      <InlineText text={line} />
    </div>
  );
}

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
