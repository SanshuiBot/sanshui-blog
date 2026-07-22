'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeToggle';
import { useState, useEffect } from 'react';
import SearchDialog from './SearchDialog';
import type { Post } from '@/lib/types';

interface HeaderProps {
  posts: Post[];
}

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/archive', label: '归档' },
  { href: '/tags', label: '标签' },
  { href: '/about', label: '关于' },
  { href: '/links', label: '友链' },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Header({ posts }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Fluid Island Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`fixed top-0 left-0 right-0 z-[var(--z-header)] flex justify-center pt-4 sm:pt-5 ${
          scrolled ? 'pt-2 sm:pt-2' : ''
        }`}
      >
        <div
          className={`relative transition-all duration-700 ease-[var(--ease-out-quint)] ${
            menuOpen
              ? 'w-full max-w-6xl mx-4 sm:mx-6 rounded-3xl'
              : 'w-max rounded-full'
          }`}
          style={{
            background: menuOpen
              ? 'transparent'
              : scrolled
                ? 'var(--glass-bg-strong)'
                : 'var(--glass-bg)',
            backdropFilter: `blur(${scrolled ? '24px' : '16px'}) saturate(1.8)`,
            WebkitBackdropFilter: `blur(${scrolled ? '24px' : '16px'}) saturate(1.8)`,
            border: '1px solid var(--glass-border)',
            boxShadow: scrolled
              ? 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          {/* Holographic top line */}
          <div className="absolute top-0 left-4 right-4 h-[1px] overflow-hidden rounded-full">
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #f472b6, #c084fc, #60a5fa, #34d399, transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className={`flex items-center justify-between ${menuOpen ? 'px-5 py-3' : 'px-4 sm:px-5 py-2.5 sm:py-3'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <span className="text-lg sm:text-xl font-bold tracking-tight holo-text group-hover:text-transparent transition-all duration-500">
                三水
              </span>
            </Link>

            {/* Desktop nav — only visible when menu closed */}
            {!menuOpen && (
              <div className="hidden md:flex items-center gap-0.5 mx-3">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-500 ease-[var(--ease-out-quint)] ${
                        isActive
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-cyan-500/10 dark:from-pink-500/20 dark:via-violet-500/20 dark:to-cyan-500/20"
                          transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => setMenuOpen(!menuOpen)}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300"
                aria-label="菜单"
                aria-expanded={menuOpen}
              >
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <motion.span
                    className="absolute block w-4 h-[1.5px] rounded-full bg-current"
                    animate={menuOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                  <motion.span
                    className="absolute block w-4 h-[1.5px] rounded-full bg-current"
                    animate={menuOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.span
                    className="absolute block w-4 h-[1.5px] rounded-full bg-current"
                    animate={menuOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Full-screen menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[calc(var(--z-header)-1)] flex items-center justify-center"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(32px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
            }}
          >
            <nav className="flex flex-col items-center gap-6">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`relative text-3xl sm:text-4xl font-bold tracking-tight transition-all duration-500 ${
                        isActive
                          ? 'holo-text-glow'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action buttons — visible when scrolled */}
      <div className="fixed bottom-6 right-6 z-[var(--z-sticky)] flex flex-col gap-3">
        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          initial={mounted ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASE }}
          className="p-3 rounded-full glass-strong text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-all duration-300 shadow-lg active:scale-95"
          aria-label="切换主题"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </motion.button>

        {/* Search */}
        <SearchDialog posts={posts} />
      </div>
    </>
  );
}
