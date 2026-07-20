'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from './ThemeToggle';
import { useState } from 'react';
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

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 8);
  });

  return (
    <header
      style={{ viewTransitionName: 'site-header' }}
      className={`fixed top-0 left-0 right-0 z-[var(--z-header)] transition-all duration-500 ease-[var(--ease-out-quint)] ${
        scrolled
          ? 'glass-strong shadow-sm py-0'
          : 'backdrop-blur-xl bg-white/75 dark:bg-stone-950/75 border-b border-stone-200/50 dark:border-stone-800/50'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* Magnetic logo */}
          <Link href="/" className="flex items-center gap-3 group relative">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: EASE, duration: 0.5 }}
              className="relative"
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                三水
              </span>
              {/* Animated underline */}
              <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gradient-to-r from-red-600 to-orange-500 group-hover:w-full transition-all duration-500 ease-[var(--ease-out-quint)]" />
              {/* Glow on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    'radial-gradient(80% 100% at 50% 50%, rgba(220,38,38,0.15), transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
            </motion.div>
          </Link>

          {/* Desktop nav with shared layout animation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute inset-0 bg-red-50 dark:bg-red-950/30 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions: command-palette search trigger + theme + mobile */}
          <div className="flex items-center gap-1.5">
            <SearchDialog posts={posts} />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200 active:scale-95"
              aria-label="切换主题"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200"
              aria-label="菜单"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="md:hidden border-t border-stone-200/50 dark:border-stone-800/50 bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl"
          >
            <nav className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
