'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from '@/components/UI/ThemeToggle';
import AccentPicker from '@/components/UI/AccentPicker';
import Tooltip from '@/components/UI/Tooltip';
import SearchModal from '@/components/UI/SearchModal';
import { withBase } from '@/lib/basePath';
import { siteConfig } from '@/lib/site';

const links = [
  { href: '/', label: '首页' },
  { href: '/archive/', label: '归档' },
  { href: '/tags/', label: '标签' },
  { href: '/about/', label: '关于' },
  { href: '/links/', label: '友链' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
              const active =
                pathname === l.href ||
                pathname === l.href.replace(/\/$/, '') ||
                (l.href !== '/' && pathname.startsWith(l.href));
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
                onClick={() => setSearchOpen(true)}
                className="p-2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                aria-label="搜索"
              >
                <Search size={16} />
              </button>
            </Tooltip>
            <ThemeToggle />
            <AccentPicker />
            <Tooltip label="菜单">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-ink/90 backdrop-blur-2xl"
              onClick={() => setMobileOpen(false)}
            />
            <nav className="relative flex flex-col items-center justify-center h-full gap-8">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={`text-3xl font-bold tracking-tight transition-all ${
                      pathname === l.href ||
                      pathname === l.href.replace(/\/$/, '') ||
                      (l.href !== '/' && pathname.startsWith(l.href))
                        ? 'text-aurora'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
