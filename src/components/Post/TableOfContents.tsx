'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import type { TocItem } from '@/lib/toc';
import { useScrollThumbGeometry } from '@/components/UI/useScrollThumbGeometry';
import { useFocusTrap } from '@/components/UI/useFocusTrap';

interface Props {
  items: TocItem[];
}

/**
 * 文章目录（TOC）
 * -----------------------------
 * 桌面端（≥lg）：右侧 sticky，随滚动高亮当前章节。
 * 移动端（<lg）：文章顶部抽屉，默认折叠，点按钮展开浮层。
 *
 * 设计要点：
 *  - 高亮逻辑：IntersectionObserver 监测视口上 30% 带，回调里收集所有 intersecting
 *    entries 后按 boundingClientRect.top 排序，取最靠上那个 —— 解决「多标题同时进入
 *    视口时高亮错乱」(P1) 与反向滚动判断。
 *  - 首屏高亮首项 (P4)：mount 时若 URL 无 hash，直接 active = items[0].id。
 *  - URL hash (P5)：点击时 history.replaceState 写 hash，刷新/分享可还原位置，但
 *    不触发原生跳转；滚动由 scrollIntoView + scroll-margin-top（globals.css）兜底。
 *  - 颜色联Accent 主题：用自定义 .toc-link / .toc-link-active 类（AGENTS.md #22/#23），
 *    不用 Tailwind utility text-accent-violet。
 *  - 淡入淡出滚动条：原生滚动条藏起来（.toc-scroll 用 scrollbar-width:none +
 *    ::-webkit-scrollbar width:0），浮一个 .toc-thumb 绝对定位指示条，按滚动比例
 *    定高度/位置；显隐「只」由 hover 控制（mouseenter 显示 / mouseleave 隐藏），opacity
 *    transition 淡入淡出。浮层 absolute 不占文档流 → 不挤压文字布局。
 *  - 移动端抽屉：打开时启用焦点陷阱（useFocusTrap），Tab 循环限制在抽屉内。
 */
export default function TableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // 移动端抽屉焦点陷阱：Tab 循环限制在抽屉可聚焦元素内，关闭后焦点还原
  useFocusTrap(drawerRef, drawerOpen);

  // SPA 文章间跳转时 App Router 复用同一组件实例、传入新的 items 数组，
  // 而 useState 初始值只在首挂载生效 —— 按 React 官方「prev 状态对比」模式
  // 在渲染期把高亮重置为新文章首项：effect 内同步 setState 会被 lint 规则
  // react-hooks/set-state-in-effect 拦截，且渲染期重置没有首帧错位。
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setActiveId(items[0]?.id ?? '');
  }

  // 高亮当前章节 —— 监测视口上 30% 带，取监测带内最靠上的标题
  useEffect(
    () => {
      if (items.length === 0) return;

      // 首屏/换文章后的高亮首项已由渲染期 prevItems 对比重置（见上方），
      // 此处 observer 只负责滚动过程的高亮接管；若 URL 已带 hash，浏览器
      // 原生滚动到位后由 observer 首回调接管高亮。
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) {
            setActiveId(visible[0].target.id);
          } else {
            // 反向滚动兜底：监测带内空了，找当前已滚过、最靠近视口顶的那个标题
            // 只取第一个（最靠上）的已滚过标题，避免全量扫描到最后一个时误判
            let lastAbove: string | null = null;
            for (const item of items) {
              const el = document.getElementById(item.id);
              if (!el) continue;
              if (el.getBoundingClientRect().top < 80) {
                lastAbove = item.id;
              } else {
                // 遇第一个未滚过标题即停止（标题按顺序排列，后面的也不会已滚过）
                break;
              }
            }
            if (lastAbove && lastAbove !== activeId) {
              // 防止在同一位置反复 setState
              setActiveId(lastAbove);
            }
          }
        },
        { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
      );

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      }

      return () => observer.disconnect();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  ); // activeId 是反向滚动兜底的防抖检查，加入依赖会让 observer 随每次高亮重连，破坏滚动监听

  // 点击跳转：平滑滚动 + 写 URL hash，但不触发原生锚点跳转 (P5)
  const handleJump = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 用 replaceState 不留 history 嗽迹，避免后退循环
      history.replaceState(null, '', `#${id}`);
      setActiveId(id);
    }
    setDrawerOpen(false);
  }, []);

  // 淡入淡出滚动条 —— 显隐「只」由 hover 控制：mouseenter → 显示，mouseleave → 隐藏。
  // 几何由 useScrollThumbGeometry hook 算（rAF 防抖 + ResizeObserver + scroll + fonts.ready 兜底），
  // 见 src/components/UI/useScrollThumbGeometry.ts 与 ADR-0001。
  // 浮层 absolute 不占文档流 → 不挤压文字布局。
  const [thumbVisible, setThumbVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbVisibleRef = useRef(false);
  const { thumb } = useScrollThumbGeometry(scrollRef);

  // 显隐「只」由 hover 控制 —— 鼠标在目录里就显示，离开就隐藏
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onEnter = () => {
      thumbVisibleRef.current = true;
      setThumbVisible(true);
    };
    const onLeave = () => {
      thumbVisibleRef.current = false;
      setThumbVisible(false);
    };
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (items.length === 0) return null;

  const list = (
    <ul className="space-y-0.5 border-l border-black/[0.1] pl-3 dark:border-white/10">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => handleJump(e, item.id)}
            className={`toc-link block py-1 text-sm truncate ${
              item.level === 2 ? 'pl-0' : 'pl-3'
            } ${activeId === item.id ? 'toc-link-active' : ''}`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* 桌面端 sticky 目录（lg:order-2：正文在 DOM 前置后，用它恢复右栏位置） */}
      <nav
        className="hidden lg:block lg:order-2 sticky top-28 w-56 shrink-0 self-start ml-8"
        aria-label="目录"
      >
        <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-widest mb-4 dark:text-gray-400">
          目录
        </h4>
        {/* 长文章目录自身可滚，不挤出视口 (P2 桌面端兜底)。
            .toc-scroll 藏原生滚动条；浮层 .toc-thumb 淡入淡出指示位置，不占文档流 → 不挤压文字 */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="toc-scroll max-h-[calc(100dvh-12rem)] overflow-y-auto pr-2"
          >
            {list}
          </div>
          {thumb && (
            <div
              className={`toc-thumb ${thumbVisible ? 'toc-thumb-visible' : ''}`}
              style={{ top: thumb.top, height: thumb.height }}
              aria-hidden="true"
            />
          )}
        </div>
      </nav>

      {/* 移动端抽屉式目录 (P2) */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass glass-flat border border-black/[0.06] text-sm text-stone-600 transition-colors dark:border-white/5 dark:text-gray-400"
          aria-expanded={drawerOpen}
          aria-controls="toc-drawer"
        >
          {drawerOpen ? <X size={16} /> : <Menu size={16} />}
          目录
          <span className="text-xs text-stone-400 dark:text-gray-600">({items.length})</span>
        </button>
        {drawerOpen && (
          <div
            ref={drawerRef}
            id="toc-drawer"
            className="mt-3 p-4 rounded-xl glass border border-black/[0.06] max-h-72 overflow-y-auto dark:border-white/5"
          >
            {list}
          </div>
        )}
      </div>
    </>
  );
}
