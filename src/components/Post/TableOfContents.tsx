'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import type { TocItem } from '@/lib/toc';

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
 *    定高度/位置；opacity transition 在「滚动中 / hover」淡入，「静止」淡出。
 *    浮层 absolute 不占文档流 → 不挤压文字布局。
 */
export default function TableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 高亮当前章节 —— 监测视口上 30% 带，取监测带内最靠上的标题
  useEffect(() => {
    if (items.length === 0) return;

    // 首屏：若 URL 已带 hash，让浏览器原生滚动到位后再由 observer 接管；
    // 否则默认高亮首项 (P4)
    if (typeof window !== 'undefined' && !window.location.hash) {
      setActiveId(items[0]!.id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        } else {
          // 反向滚动兜底：监测带内空了，找当前已滚过、最靠近视口顶的那个标题
          let lastAbove: string | null = null;
          for (const item of items) {
            const el = document.getElementById(item.id);
            if (!el) continue;
            if (el.getBoundingClientRect().top < 80) {
              lastAbove = item.id;
            } else {
              break;
            }
          }
          if (lastAbove) setActiveId(lastAbove);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  // 点击跳转：平滑滚动 + 写 URL hash，但不触发原生锚点跳转 (P5)
  const handleJump = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 用 replaceState 不留 history 嗽迹，避免后退循环
        history.replaceState(null, '', `#${id}`);
        setActiveId(id);
      }
      setDrawerOpen(false);
    },
    [],
  );

  // 淡入淡出滚动条 —— 显隐「只」由 hover 控制：mouseenter → 显示，mouseleave → 隐藏。
  // 几何由 ResizeObserver + rAF 延迟算准（等布局稳定），scroll 时仅同步 top。
  // 浮层 absolute 不占文档流 → 不挤压文字布局。
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);
  const [thumbVisible, setThumbVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbVisibleRef = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // thumb 几何：若内容不超出视高则卸载浮层；否则按可滚比例算 top/height
    const update = () => {
      const viewport = container.clientHeight;
      const total = container.scrollHeight;
      if (total <= viewport) {
        setThumb(null);
        return;
      }
      const ratio = viewport / total;
      const scrollTop = container.scrollTop;
      const height = Math.max(viewport * ratio, 24);
      const top = (scrollTop / (total - viewport)) * (viewport - height);
      setThumb({ top, height });
    };

    // 首次与字体加载后延延算准 —— rAF 等布局稳定，fonts.ready 兜底
    let raf = requestAnimationFrame(update);
    if (document.fonts?.ready) document.fonts.ready.then(update).then(() => update());

    // ResizeObserver：容器或内容尺寸变时重算（缩放窗 / 新内容）
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    });
    ro.observe(container);
    ro.observe(container.firstElementChild ?? container);

    // scroll 时只同步 top（height 不变），hover 显隐由下面 mouseenter/leave 管
    const onScroll = () => {
      if (!thumbVisibleRef.current) return;
      const viewport = container.clientHeight;
      const total = container.scrollHeight;
      if (total <= viewport) return;
      const scrollTop = container.scrollTop;
      const ratio = viewport / total;
      const height = Math.max(viewport * ratio, 24);
      const top = (scrollTop / (total - viewport)) * (viewport - height);
      setThumb({ top, height });
    };

    // 显隐「只」由 hover 控制 —— 鼠标在目录里就显示，离开就隐藏
    const onEnter = () => {
      thumbVisibleRef.current = true;
      setThumbVisible(true);
      update();
    };
    const onLeave = () => {
      thumbVisibleRef.current = false;
      setThumbVisible(false);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, [items]);

  if (items.length === 0) return null;

  const list = (
    <ul className="space-y-0.5 border-l border-white/10 pl-3">
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
      {/* 桌面端 sticky 目录 */}
      <nav
        className="hidden lg:block sticky top-28 w-56 shrink-0 self-start ml-8"
        aria-label="目录"
      >
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
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
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass border border-white/5 text-sm text-gray-400 transition-colors"
          aria-expanded={drawerOpen}
          aria-controls="toc-drawer"
        >
          {drawerOpen ? <X size={16} /> : <Menu size={16} />}
          目录
          <span className="text-xs text-gray-600">({items.length})</span>
        </button>
        {drawerOpen && (
          <div
            id="toc-drawer"
            className="mt-3 p-4 rounded-xl glass border border-white/5 max-h-72 overflow-y-auto"
          >
            {list}
          </div>
        )}
      </div>
    </>
  );
}
