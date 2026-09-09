'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { postUrl, type PostIndexEntry } from '@/lib/post-index';
import { tokenize, splitByTerms } from '@/lib/search';
import { formatDate } from '@/lib/formatDate';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';
import { useDismiss } from '@/components/UI/useDismiss';
import { useScrollLock } from '@/components/UI/useScrollLock';
import { useFocusTrap } from '@/components/UI/useFocusTrap';
import { useRouter } from 'next/navigation';
import { searchHotkeyLabel } from '@/lib/platform';
import { getPostsIndex } from '@/lib/posts-index-cache';

/** 命中词元用 <mark> 高亮（样式 .search-mark 收口在 globals.css） */
function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitByTerms(text, query).map((seg, i) =>
        seg.hit ? (
          <mark key={i} className="search-mark">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/**
 * props 用具名 interface 而非内联类型字面量：Next.js TS 插件（client-boundary 规则）
 * 只检查内联字面量中的函数类型 prop，会误报 onClose「不是 Server Action」——
 * 但 onClose 是纯客户端回调（Navbar 传 () => setSearchOpen(false)），永不跨 Server/Client 边界。
 */
interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<PostIndexEntry[] | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { startNavigation } = useNavigationLoading();
  const router = useRouter();
  // 手机端渲染减负：全屏 backdrop-blur + scale/y 位移动画在小屏（尤其低端机）
  // 上的光栅化/合成耗时是「弹窗慢半拍」的元凶，触屏设备改用纯 opacity 过渡
  // + 面板去 backdrop-filter（面板自身 0.85+ 不透明度，视觉几乎无差）。
  // 本组件是纯客户端动态加载（Navbar loadChunk），不参与 SSR/水合，
  // 可安全惰性初始化，无 hydration mismatch 风险。
  const [touchDevice] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0),
  );

  // 点击外部 / Esc 关闭（外点判定 + 延迟绑定统一收口在 useDismiss）
  useDismiss(panelRef, onClose, { enabled: open });
  // 打开时锁定 body 滚动 + Tab 焦点圈在模态内（统一收口 useScrollLock / useFocusTrap）
  useScrollLock(open);
  useFocusTrap(panelRef, open);

  // 首次打开时拉取轻量索引（~10KB），不再走 RSC payload。
  // 使用共享缓存：与 PostsList / HeroParallax 共用同一 Promise，避免重复请求
  // AbortController：关闭/卸载时中断在途请求；AbortError 不落空态，下次打开重试
  useEffect(() => {
    if (!open || posts !== null) return;
    const ac = new AbortController();
    getPostsIndex()
      .then((data) => {
        if (!ac.signal.aborted) setPosts(data);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') setPosts([]);
      });
    return () => ac.abort();
  }, [open, posts]);

  // 关闭时清空搜索词 + 选中态：渲染期间调整 state（React 官方模式，避免 effect 内同步 setState）
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setQ('');
      setActiveIdx(-1);
    }
  }

  useEffect(() => {
    if (!open) return;
    // 延迟聚焦等 DOM 就位；StrictMode 下 effect 会跑两次，
    // 用 ref 持有定时器在 cleanup 中清，避免重复触发/卸载后回调
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  // fuse.js 模糊搜索：支持 typo 容错、权重排序。保留 lib/search.ts 的
  // 「空格分词 AND」语义——每个词元独立搜索，取所有词元结果的交集，
  // 保证 placeholder「空格分隔多关键词」文案与实际行为一致。
  const fuse = useMemo(() => {
    if (!posts) return null;
    return new Fuse(posts, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'excerpt', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
      ],
      threshold: 0.35,
      includeMatches: true,
    });
  }, [posts]);

  const results = useMemo(() => {
    if (!fuse) return [];
    const terms = tokenize(q);
    if (terms.length === 0) return [];
    // 多词元 AND：每词独立模糊搜索（各取 20 条），按 slug 交集合并；
    // 单词元直接取搜索结果（保持 fuse 的相关度排序）
    const [firstTerm] = terms;
    if (terms.length === 1 && firstTerm) {
      return fuse.search(firstTerm, { limit: 20 }).map((r) => r.item);
    }
    const perTerm = terms
      .map((t) => fuse.search(t, { limit: 20 }).map((r) => r.item as PostIndexEntry))
      .filter((list): list is PostIndexEntry[] => list.length > 0);
    const [first, ...rest] = perTerm;
    if (!first) return [];
    return first.filter((p) => rest.every((list) => list.some((r) => r.slug === p.slug)));
  }, [fuse, q]);

  // query/posts 变化时重置选中到第一项（有结果时），保持键盘流连续
  const [prevQuery, setPrevQuery] = useState<readonly [string, PostIndexEntry[] | null]>([
    q,
    posts,
  ]);
  if (prevQuery[0] !== q || prevQuery[1] !== posts) {
    setPrevQuery([q, posts]);
    setActiveIdx(results.length > 0 ? 0 : -1);
  }

  const hasQuery = q.trim().length > 0;
  const noResults = posts !== null && hasQuery && results.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[18vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // 触屏设备：去面板 backdrop-filter（0.85+ 不透明度视觉无差）、入场动画
            // 退化为纯 opacity——这两处是弹窗出现慢半拍的主因；蒙层保留小半径
            // backdrop-blur（8px，光栅化开销远小于 32px 面板 blur）+ 75/85 不透明度：
            // 既要压暗也要糊掉背景文字，否则手机上仍能辨认后面的字
            className={
              touchDevice
                ? 'fixed inset-0 bg-black/75 backdrop-blur dark:bg-black/85'
                : 'fixed inset-0 bg-black/60 backdrop-blur-sm dark:bg-black/75'
            }
          />
          <motion.div
            ref={panelRef}
            initial={touchDevice ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -20 }}
            animate={touchDevice ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={touchDevice ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-xl glass-heavy shadow-emboss-hover rounded-2xl overflow-hidden border border-black/[0.1] search-modal-panel${
              touchDevice ? ' search-modal-panel--lite' : ''
            }`}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/5">
              <Search size={18} className="text-stone-500 shrink-0 dark:text-gray-500" />
              <input
                ref={inputRef}
                id="search-input"
                type="text"
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (results.length > 0) {
                      setActiveIdx((i) => (i + 1) % results.length);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (results.length > 0) {
                      setActiveIdx((i) => (i - 1 + results.length) % results.length);
                    }
                  } else if (e.key === 'Enter') {
                    const post = results[activeIdx];
                    if (!post) return;
                    e.preventDefault();
                    onClose();
                    startNavigation();
                    router.push(postUrl(post.slug));
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                  } else if (e.key === 'Backspace' && q === '') {
                    // 输入框为空时 Backspace 关闭搜索（与 Gmail 等常见模式一致）
                    e.preventDefault();
                    onClose();
                  }
                }}
                placeholder="搜索文章（空格分隔多关键词）..."
                className="flex-1 bg-transparent text-stone-900 placeholder-gray-500 outline-none text-base dark:text-fg"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="text-stone-500 hover:text-stone-900 dark:text-gray-500 dark:hover:text-fg"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={onClose}
                className="search-close-btn flex items-center gap-1.5 text-[11px]"
              >
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/[0.03] text-stone-500 dark:bg-white/5 dark:text-gray-500">
                  ESC
                </kbd>
                <span>关闭</span>
              </button>
            </div>
            <div className="max-h-[60dvh] sm:max-h-80 overflow-y-auto p-2">
              {posts === null ? (
                <div className="text-center py-10 text-stone-500 text-sm dark:text-gray-500">
                  加载中...
                </div>
              ) : noResults ? (
                <div
                  className="text-center py-10 text-stone-500 text-sm dark:text-gray-500"
                  aria-live="polite"
                >
                  未找到与「{q.trim()}」匹配的文章
                </div>
              ) : results.length > 0 ? (
                <>
                  {/* 结果数播报只出现一次，避免每条结果都触发读屏重复播报。
                      放在 listbox 外：WAI-ARIA 要求 listbox 的子元素只能是 option */}
                  <span className="sr-only" aria-live="polite" aria-atomic="true">
                    {q ? `找到 ${results.length} 篇文章` : '文章列表'}
                  </span>
                  <div role="listbox" aria-label="搜索结果">
                    {results.map((p: PostIndexEntry, i: number) => (
                      <motion.div
                        key={p.slug}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.015 }}
                      >
                        <Link
                          href={postUrl(p.slug)}
                          data-active={i === activeIdx}
                          role="option"
                          aria-selected={i === activeIdx}
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => {
                            onClose();
                            startNavigation();
                          }}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${
                            i === activeIdx ? 'bg-black/[0.03] dark:bg-white/5' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <span
                              className={`font-medium transition-colors truncate block ${
                                i === activeIdx
                                  ? 'text-accent-violet'
                                  : 'text-stone-900 dark:text-fg'
                              }`}
                            >
                              <Highlight text={p.title} query={q} />
                            </span>
                            <span className="block text-xs text-stone-500 truncate mt-0.5 dark:text-gray-500">
                              <Highlight text={p.excerpt} query={q} />
                            </span>
                            <span className="text-[11px] text-stone-400 dark:text-gray-600">
                              {formatDate(p.date)}
                            </span>
                          </div>
                          <ArrowRight
                            size={14}
                            className={`shrink-0 transition-colors ${
                              i === activeIdx
                                ? 'text-accent-violet'
                                : 'text-stone-400 dark:text-gray-600'
                            }`}
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : !hasQuery && posts ? (
                <div role="listbox" aria-label="最近文章">
                  <div className="px-3 py-2 text-[11px] font-medium text-stone-400 dark:text-gray-500 uppercase tracking-widest">
                    最近文章
                  </div>
                  {posts.slice(0, 5).map((p, i) => (
                    <Link
                      key={p.slug}
                      href={postUrl(p.slug)}
                      role="option"
                      aria-selected={i === activeIdx}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => {
                        onClose();
                        startNavigation();
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                        i === activeIdx ? 'bg-black/[0.03] dark:bg-white/5' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span
                          className={`font-medium text-sm truncate block transition-colors ${
                            i === activeIdx ? 'text-accent-violet' : 'text-stone-900 dark:text-fg'
                          }`}
                        >
                          {p.title}
                        </span>
                        <span className="text-[11px] text-stone-400 dark:text-gray-600">
                          {formatDate(p.date)}
                        </span>
                      </div>
                      <ArrowRight
                        size={12}
                        className={`shrink-0 transition-colors ${
                          i === activeIdx
                            ? 'text-accent-violet'
                            : 'text-stone-400 dark:text-gray-600 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.06] dark:border-white/5">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-gray-500">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-black/[0.03] border border-black/[0.1] font-mono dark:bg-white/5 dark:border-white/10 text-[10px]">
                  {searchHotkeyLabel()}
                </kbd>
                <span className="hidden sm:inline">搜索</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-gray-500">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-black/[0.03] border border-black/[0.1] font-mono dark:bg-white/5 dark:border-white/10 text-[10px]">
                  ↑↓
                </kbd>
                <span className="hidden sm:inline">选择</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-black/[0.03] border border-black/[0.1] font-mono dark:bg-white/5 dark:border-white/10 text-[10px]">
                  ↵
                </kbd>
                <span className="hidden sm:inline">打开</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-black/[0.03] border border-black/[0.1] font-mono dark:bg-white/5 dark:border-white/10 text-[10px]">
                  ESC
                </kbd>
                <span className="hidden sm:inline">关闭</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
