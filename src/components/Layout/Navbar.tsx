'use client';
import { useCallback, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, Mail } from 'lucide-react';
import ThemeToggle from '@/components/UI/ThemeToggle';
import Github from '@/components/UI/GithubIcon';
import AccentPicker from '@/components/UI/AccentPicker';
import Tooltip from '@/components/UI/Tooltip';

// SearchModal 懒加载：首次 ⌘K/点击打开才拉取搜索代码（~13KB chunk），不占每页首载包。
// 关键（移动端「点击多次/很久才弹窗」修复）：加载态收口为「共享 Promise」——
// 挂载后 idle 预取与点击打开共用同一个 import Promise（见下），点击总是先置
// searchOpen=true，任何时刻 SearchModal 都随 Navbar 渲染（内部按 open 显隐），
// 不再存在「open=true 但组件分支缺失」的卡住窗口；chunk 加载失败缓存清空，
// 下次点击自动重试。条件挂载后关闭动画退化为即时消失（进入动画仍由组件内播放）。
type SearchModalComponent = typeof import('@/components/UI/SearchModal').default;
import { useDismiss } from '@/components/UI/useDismiss';
import { useScrollLock } from '@/components/UI/useScrollLock';
import { useFocusTrap } from '@/components/UI/useFocusTrap';
import { siteConfig } from '@/lib/site';
import { withBase } from '@/lib/basePath';
import { searchHotkeyLabel } from '@/lib/platform';
import { navLinks } from '@/lib/navLinks';
import { getPostsIndex } from '@/lib/posts-index-cache';

/** 导航链接激活判定：精确匹配 / 去尾斜杠匹配 / 非首页前缀匹配（桌面导航与移动抽屉共用） */
const isActive = (pathname: string, href: string) =>
  pathname === href ||
  pathname === href.replace(/\/$/, '') ||
  (href !== '/' && pathname.startsWith(href));

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // 懒加载的搜索组件（null = 未加载/加载失败，失败后下次打开自动重试）；
  // chunkPromisesRef 缓存进行中的 import Promise：idle 预取与点击打开共享同一 Promise，
  // 预取命中后点击时 resolve 已在缓存，setTimeout(0) 内同步 setState 挂载，点击即弹。
  const [SearchModalComp, setSearchModalComp] = useState<SearchModalComponent | null>(null);
  const chunkPromisesRef = useRef<Promise<SearchModalComponent> | null>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  // 移动端菜单仅启用 Esc 关闭：开关按钮在 header（浮层外），mousedown 外点判定会误关，
  // 与按钮 onClick 形成开关竞态；外点关闭继续由遮罩 onClick 负责
  useDismiss(mobileMenuRef, () => setMobileOpen(false), { enabled: mobileOpen, outside: false });
  // 抽屉打开时锁定背景滚动 + Tab 焦点圈在抽屉内（统一收口 useScrollLock / useFocusTrap）
  useScrollLock(mobileOpen);
  useFocusTrap(mobileMenuRef, mobileOpen);

  // 原生 passive scroll listener（framer-motion 已移出首屏 layout，约定 #32 CSS 优先）；
  // setScrolled 同值时 React 自动 bail-out，只在跨过 20px 阈值时触发一次重渲染
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // 路由切换时关闭移动端菜单：渲染期间调整 state（React 官方模式，避免 effect 内同步 setState）
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // 搜索 chunk 懒加载（移动端「点几次才弹/等很久」根治）：
  //  - loadChunk()：唯一加载入口，Promise 缓存在 ref —— idle 预取与点击打开
  //    共享同一次 import，不会重复请求；失败清缓存，下次可重试。
  //  - 挂载后 idle 预取：弱机上滑动手感和粒子动画吃主线程，等用户点击再下载
  //    chunk 就已经慢了，提前拉取让点击时大概率命中缓存秒开。
  //  iOS Safari 无 requestIdleCallback 时退化为 2s 后执行；均不阻塞首帧。
  const loadChunk = useCallback(() => {
    const cached = chunkPromisesRef.current;
    if (cached) return cached;
    const p = import('@/components/UI/SearchModal')
      .then((m) => m.default)
      .then((Comp) => {
        setSearchModalComp(() => Comp);
        return Comp;
      })
      .catch(() => {
        // chunk 加载失败（旧部署哈希 404/网络错误）：清缓存，下次点击重试；
        // 已打开的搜索随之关闭，不渲染死态
        chunkPromisesRef.current = null;
        setSearchModalComp(null);
        setSearchOpen(false);
        throw new Error('search chunk failed');
      });
    chunkPromisesRef.current = p;
    return p;
  }, []);

  useEffect(() => {
    const preload = () => {
      loadChunk().catch(() => {
        /* 预取失败静默：真实点击仍走 openSearch 的共享 Promise 重试路径 */
      });
      getPostsIndex().catch(() => {
        /* 索引拉取失败留空，SearchModal 打开时按原逻辑自处理 */
      });
    };
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(preload, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(preload, 2000);
    return () => clearTimeout(t);
  }, [loadChunk]);

  // 打开搜索：只置 open，首次触发 chunk 加载。SearchModal 始终随 Navbar 渲染
  // （内部按 open 显隐 + AnimatePresence），不再有「open=true 但组件缺失」的空窗。
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    loadChunk().catch(() => {
      /* 失败已在 loadChunk 内关闭并清缓存，下次点击重试 */
    });
  }, [loadChunk]);

  // 消费 hydration 前的原生点击意图（见 accents.ts searchToggleClickScript）：
  // 移动端首载 React 尚未 hydrate 时点搜索图标，委托脚本记 __searchIntent 并显示
  // 原生「正在打开搜索…」占位；本组件挂载后在此补打开真弹窗，点击意图不丢失。
  // setTimeout(0)：挂载帧不 setState（set-state-in-effect），下一轮事件循环消费。
  useEffect(() => {
    const w = window as typeof window & { __searchIntent?: boolean };
    if (w.__searchIntent !== true) return;
    w.__searchIntent = false;
    const t = setTimeout(openSearch, 0);
    return () => clearTimeout(t);
  }, [openSearch]);

  // chunk 就绪（真弹窗可挂载）后移除原生的 hydration 前占位弹层，无缝衔接
  useEffect(() => {
    if (SearchModalComp === null) return;
    document.getElementById('search-pre-hydration')?.remove();
    document.getElementById('search-pre-hydration-style')?.remove();
  }, [SearchModalComp]);

  // 全局 ⌘K / Ctrl+K 打开搜索 + Esc 关闭兜底（开关状态收敛在 Navbar 持有 searchOpen）。
  // Esc 兜底覆盖「chunk 未到/加载失败」窗口期——此时模态未挂载，组件内 useDismiss
  // 的 Esc 无处消费；模态挂载后两处 Esc 均触发 setSearchOpen(false)，幂等。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch, searchOpen]);

  // 抽屉打开时锁定背景滚动：遮罩半透明，避免背景在抽屉下滚动穿帮。
  // （锁定逻辑已收口到 useScrollLock，此处删除手写实现）
  // 视口跨过 md 断点（≥768px）时关闭抽屉：抽屉/遮罩/菜单按钮均 md:hidden，
  // 不关闭的话 mobileOpen 保持 true，上面的 body 滚动锁会永久泄漏（横屏/拉宽窗口时页面卡住）
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 nav-dotted nav-fade-in ${
          scrolled ? 'nav-scrolled border-b border-black/[0.06] shadow-nav dark:border-white/5' : ''
        }`}
      >
        <nav className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src={withBase('/logo.svg')}
              alt="三水"
              width={24}
              height={24}
              loading="eager"
              fetchPriority="low"
              className="nav-logo shrink-0 h-6"
            />
            <span className="nav-brand text-lg font-bold tracking-tight text-aurora leading-none">
              {siteConfig.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch={l.prefetch}
                  aria-current={active ? 'page' : undefined}
                  className={`nav-link group relative py-1 text-sm transition-colors duration-200 cursor-pointer ${
                    active
                      ? 'is-active text-stone-900 dark:text-fg font-semibold'
                      : 'text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-fg font-normal'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {/* #search-toggle 锚点：hydration 前由 accents.ts 的 searchToggleClickScript
                事件委托命中（脚本检测到内部 <button> 即自注销让位给 openSearch） */}
            <div id="search-toggle" className="contents">
              <Tooltip label={`搜索 (${searchHotkeyLabel()})`}>
                <button
                  onClick={() => {
                    openSearch();
                    setMobileOpen(false);
                  }}
                  className="nav-icon-btn p-2 w-9 h-9 flex items-center justify-center rounded-xl text-stone-600 hover:text-stone-900 hover:bg-black/[0.03] dark:text-gray-400 dark:hover:text-fg dark:hover:bg-white/5"
                  aria-label="搜索"
                >
                  <Search size={16} />
                </button>
              </Tooltip>
            </div>
            <ThemeToggle />
            <AccentPicker />
            <Tooltip label="菜单" disabled={mobileOpen}>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="nav-icon-btn p-2 w-9 h-9 flex items-center justify-center rounded-xl text-stone-600 hover:text-stone-900 hover:bg-black/[0.03] dark:text-gray-400 dark:hover:text-fg dark:hover:bg-white/5 md:hidden"
                aria-label="菜单"
                aria-expanded={mobileOpen}
                aria-controls="mobile-drawer"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </Tooltip>
          </div>
        </nav>
      </header>

      {/* 移动端抽屉：常驻渲染 + CSS transition（framer-motion 已移出首屏 layout）。
          遮罩 opacity 过渡 + 关闭态 pointer-events-none；抽屉 translate-x 过渡，
          关闭态 translate-x-full 移出视口 + inert 禁用交互（TOC 抽屉同款模式）。
          reduced-motion 下全局 0.01ms 压制自动合规（约定 #32）。 */}
      <div
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 md:hidden bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        ref={mobileMenuRef}
        inert={!mobileOpen}
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 right-0 z-40 md:hidden w-[min(20rem,85vw)] glass-heavy border-l border-black/[0.1] flex flex-col px-8 pt-20 pb-8 overflow-y-auto transition-transform duration-300 ease-out dark:border-white/10 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3 dark:text-gray-400">
          导航
        </p>
        <nav className="flex flex-col gap-1">
          {navLinks.map((l, i) => {
            const active = isActive(pathname, l.href);
            // 链接错峰入场：CSS transition-delay 替代 framer 的 delay variants；
            // 关闭时 delay 归零（立即收回），reduced-motion 全局压制自动合规
            return (
              <div
                key={l.href}
                className={`transition-all duration-300 ease-out ${
                  mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                }`}
                style={{ transitionDelay: mobileOpen ? `${0.08 + i * 0.05}s` : '0s' }}
              >
                <Link
                  href={l.href}
                  prefetch={l.prefetch}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-2.5 text-xl font-semibold transition-colors ${
                    active
                      ? 'text-aurora'
                      : 'text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-fg'
                  }`}
                >
                  <span
                    className={`h-4 w-1 rounded-full transition-opacity duration-300 ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ background: 'rgb(var(--accent-violet-rgb))' }}
                  />
                  {l.label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-black/[0.1] dark:border-white/10">
          <div className="flex items-center gap-5">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link footer-link-bright inline-flex items-center gap-2 text-sm text-stone-600"
            >
              <Github size={14} />
              GitHub
            </a>
            <a
              href={siteConfig.emailHref}
              className="footer-link footer-link-bright inline-flex items-center gap-2 text-sm text-stone-600"
            >
              <Mail size={14} />
              Email
            </a>
          </div>
          <p className="mt-6 text-xs text-stone-400 dark:text-gray-500">
            &copy; {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </aside>
      {/* SearchModal 始终随 Navbar 挂载（未加载时为 null 分支），由 open 驱动显隐：
          点击即置 open=true，chunk 就绪的同一帧组件就在 DOM 里，无「点了没反应」空窗 */}
      {SearchModalComp !== null && (
        <SearchModalComp open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
