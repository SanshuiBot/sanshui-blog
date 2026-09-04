'use client';
/**
 * 归档页标题右侧的「筛选 ▾」按钮 + 下拉浮层
 * -----------------------------
 *  - 按钮紧贴「全部文章」标题右侧（archive/page.tsx 的 flex 同行），不占额外垂直空间。
 *  - 点击展开浮层：tag chip 列表 + 「查看全部标签」入口。浮层绝对定位，不挤压文章网格。
 *  - 交互：点击外部 / Esc 关闭；点击 chip 跳转 /tags/[tag]。
 *  - 亮/暗双主题：.archive-filter-* 颜色走 --af-* 变量（默认亮值 / html.dark 暗值），
 *    bg/border 由 glass/glass-heavy + 双主题 border utility 提供。
 *  - 防御 React 18 StrictMode 双 mount：所有 effect 在 cleanup 里解绑，open 状态用函数式更新。
 */
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Filter, Hash, X } from 'lucide-react';
import { useDismiss } from '@/components/UI/useDismiss';

interface TagItem {
  name: string;
  count: number;
}

export default function FilterDropdown({ tags }: { tags: TagItem[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部 / Esc 关闭（外点判定 + 延迟绑定统一收口在 useDismiss）
  useDismiss(containerRef, () => setOpen(false), { enabled: open });

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="archive-filter-btn group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass glass-flat border border-black/[0.06] hover:border-accent-violet/40 transition-colors duration-200 cursor-pointer dark:border-white/5"
        aria-label="按标签筛选"
        aria-expanded={open}
      >
        <Filter size={13} className="archive-filter-btn-icon archive-filter-btn-icon-hover" />
        <span className="archive-filter-btn-label hidden sm:inline transition-colors duration-200">
          筛选
        </span>
        <span className="archive-filter-btn-count text-xs transition-colors duration-200">
          {tags.length}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="按标签筛选"
          className="archive-filter-panel absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl glass-heavy p-4 z-50"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-widest dark:text-gray-500">
              按标签筛选
            </span>
            <button
              onClick={() => setOpen(false)}
              className="archive-filter-close p-1 rounded-md transition-colors duration-200 cursor-pointer"
              aria-label="关闭筛选"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Link
                key={t.name}
                href={`/tags/${encodeURIComponent(t.name)}/`}
                onClick={() => setOpen(false)}
                className="archive-filter-chip archive-filter-chip-name archive-filter-chip-count group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs glass glass-flat border border-black/[0.06] hover:border-accent-violet/40 transition-colors duration-200 dark:border-white/5"
              >
                <Hash
                  size={10}
                  className="archive-filter-chip-hash archive-filter-chip-hash-hover"
                />
                <span className="archive-filter-chip-name-text transition-colors duration-200">
                  {t.name}
                </span>
                <span className="archive-filter-chip-count-text text-[10px] transition-colors">
                  {t.count}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-black/[0.1] dark:border-white/10">
            <Link
              href="/tags/"
              onClick={() => setOpen(false)}
              className="archive-filter-all block text-center text-xs transition-colors duration-200"
            >
              查看全部标签 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
