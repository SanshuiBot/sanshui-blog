'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Mail } from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from '@/components/UI/ThemeToggle';
import Github from '@/components/UI/GithubIcon';
import AccentPicker from '@/components/UI/AccentPicker';
import Tooltip from '@/components/UI/Tooltip';
import SearchModal from '@/components/UI/SearchModal';
import { useDismiss } from '@/components/UI/useDismiss';
import { withBase } from '@/lib/basePath';
import { siteConfig } from '@/lib/site';

const links = [
  { href: '/', label: '首页' },
  { href: '/archive/', label: '归档' },
  { href: '/tags/', label: '标签' },
  { href: '/about/', label: '关于' },
  { href: '/links/', label: '友链' },
];

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
  const mobileMenuRef = useRef<HTMLElement>(null);

  // 移动端菜单仅启用 Esc 关闭：开关按钮在 header（浮层外），mousedown 外点判定会误关，
  // 与按钮 onClick 形成开关竞态；外点关闭继续由遮罩 onClick 负责
  useDismiss(mobileMenuRef, () => setMobileOpen(false), { enabled: mobileOpen, outside: false });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // 路由切换时关闭移动端菜单：渲染期间调整 state（React 官方模式，避免 effect 内同步 setState）
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // 全局 ⌘K / Ctrl+K 打开搜索：监听此前被 SearchModal 的 open 门控导致快捷键失效，
  // 开关状态与快捷键收敛在同一模块（Navbar 持有 searchOpen）。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 抽屉打开时锁定背景滚动：遮罩半透明，避免背景在抽屉下滚动穿帮
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  // 视口跨过 md 断点（≥768px）时关闭抽屉：抽屉/遮罩/菜单按钮均 md:hidden，
  // 不关闭的话 mobileOpen 保持 true，上面的 body 滚动锁会永久泄漏（横屏/拉宽窗口时页面卡死）
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
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass-heavy border-b border-white/5 shadow-nav' : 'bg-transparent'
        }`}
      >
        <nav className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src={withBase('/logo.svg')}
              width={22}
              height={22}
              alt={siteConfig.name}
              className="shrink-0"
              priority
            />
            <span className="text-lg font-bold tracking-tight text-aurora">{siteConfig.name}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`group relative py-1 text-sm transition-colors duration-200 cursor-pointer ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-gray-400 hover:text-white font-normal'
                  }`}
                >
                  {l.label}
                  {/* 激活态：一道短色线指示当前位置，spring 滑动 */}
                  {active && (
                    <motion.span
                      layoutId="nav-active-line"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                      style={{ background: 'rgb(var(--accent-violet-rgb))' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip label="搜索 (⌘K)">
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setMobileOpen(false);
                }}
                className="p-2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
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
                className="p-2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all md:hidden"
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
              {links.map((l, i) => {
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
                &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
