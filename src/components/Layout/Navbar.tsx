'use client';
import { useCallback, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Menu, X, Mail } from 'lucide-react';
import ThemeToggle from '@/components/UI/ThemeToggle';
import Github from '@/components/UI/GithubIcon';
import AccentPicker from '@/components/UI/AccentPicker';
import Tooltip from '@/components/UI/Tooltip';

// SearchModal 懒加载：首次 ⌘K/点击打开才拉取搜索代码（~13KB chunk），不占每页首载包。
// 手动 import 而非 next/dynamic：chunk 加载失败（旧部署哈希 404/网络错误）可关闭并
// 下次自动重试，避免 dynamic 无错误回退时永久卡在「open 但不渲染」的死态。
// 条件挂载后关闭动画退化为即时消失（进入动画仍由组件内 AnimatePresence 播放）。
type SearchModalComponent = typeof import('@/components/UI/SearchModal').default;
import { useDismiss } from '@/components/UI/useDismiss';
import { useScrollLock } from '@/components/UI/useScrollLock';
import { useFocusTrap } from '@/components/UI/useFocusTrap';
import { siteConfig } from '@/lib/site';
import { withBase } from '@/lib/basePath';
import { searchHotkeyLabel } from '@/lib/platform';
import { navLinks } from '@/lib/navLinks';

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
  // 懒加载的搜索组件（null = 未加载/加载失败，失败后下次打开自动重试）
  const [SearchModalComp, setSearchModalComp] = useState<SearchModalComponent | null>(null);
  const searchLoadingRef = useRef(false);
  const mobileMenuRef = useRef<HTMLElement>(null);

  // 移动端菜单仅启用 Esc 关闭：开关按钮在 header（浮层外），mousedown 外点判定会误关，
  // 与按钮 onClick 形成开关竞态；外点关闭继续由遮罩 onClick 负责
  useDismiss(mobileMenuRef, () => setMobileOpen(false), { enabled: mobileOpen, outside: false });
  // 抽屉打开时锁定背景滚动 + Tab 焦点圈在抽屉内（统一收口 useScrollLock / useFocusTrap）
  useScrollLock(mobileOpen);
  useFocusTrap(mobileMenuRef, mobileOpen);

  // 用 useMotionValueEvent 替代原生 scroll listener：与 ParticleField 等 rAF 循环共享
  // 同一事件循环批次，减少 scroll 事件分发开销
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 20));
  // 路由切换时关闭移动端菜单：渲染期间调整 state（React 官方模式，避免 effect 内同步 setState）
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // 打开搜索：置 open + 首次惰性加载搜索 chunk（成功后挂载组件，失败关闭可重试）
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    if (SearchModalComp !== null || searchLoadingRef.current) return;
    searchLoadingRef.current = true;
    import('@/components/UI/SearchModal')
      .then((m) => setSearchModalComp(() => m.default))
      .catch(() => {
        // chunk 加载失败（旧部署哈希 404/网络错误）：关闭模态，下次打开重试，不渲染死态
        setSearchOpen(false);
      })
      .finally(() => {
        searchLoadingRef.current = false;
      });
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
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 nav-dotted ${
          scrolled ? 'nav-scrolled border-b border-white/5 shadow-nav' : ''
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
                      ? 'is-active text-white font-semibold'
                      : 'text-gray-400 hover:text-white font-normal'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip label={`搜索 (${searchHotkeyLabel()})`}>
              <button
                onClick={() => {
                  openSearch();
                  setMobileOpen(false);
                }}
                className="nav-icon-btn p-2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                aria-label="搜索"
              >
                <Search size={16} />
              </button>
            </Tooltip>
            <ThemeToggle />
            <AccentPicker />
            <Tooltip label="菜单" disabled={mobileOpen}>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="nav-icon-btn p-2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 md:hidden"
                aria-label="菜单"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </Tooltip>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu-mask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
        {mobileOpen && (
          <motion.aside
            key="mobile-menu-drawer"
            ref={mobileMenuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-y-0 right-0 z-40 md:hidden w-[min(20rem,85vw)] glass-heavy border-l border-white/10 flex flex-col px-8 pt-20 pb-8 overflow-y-auto"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              导航
            </p>
            <nav className="flex flex-col gap-1">
              {navLinks.map((l, i) => {
                const active = isActive(pathname, l.href);
                return (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05 }}
                  >
                    <Link
                      href={l.href}
                      prefetch={l.prefetch}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 py-2.5 text-xl font-semibold transition-colors ${
                        active ? 'text-aurora' : 'text-gray-400 hover:text-white'
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
                  </motion.div>
                );
              })}
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10">
              <div className="flex items-center gap-5">
                <a
                  href={siteConfig.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link inline-flex items-center gap-2 text-sm text-gray-400"
                >
                  <Github size={14} />
                  GitHub
                </a>
                <a
                  href={siteConfig.emailHref}
                  className="footer-link inline-flex items-center gap-2 text-sm text-gray-400"
                >
                  <Mail size={14} />
                  Email
                </a>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                &copy; {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {searchOpen && SearchModalComp !== null && (
        <SearchModalComp open onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
