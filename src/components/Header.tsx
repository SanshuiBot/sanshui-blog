'use client';

import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeToggle';
import { useState } from 'react';
import SearchDialog from './SearchDialog';
import { NavigationButton } from '@/lib/transition';
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
  const [deepScrolled, setDeepScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 8);
    setDeepScrolled(v > 80);
  });

  return (
    <header
      style={{ viewTransitionName: 'site-header' }}
      className={`fixed top-0 left-0 right-0 z-[var(--z-header)] transition-all duration-700 ease-[var(--ease-out-quint)] ${
        deepScrolled
          ? 'glass-strong shadow-holographic py-0'
          : scrolled
            ? 'glass-strong shadow-sm py-0'
            : 'backdrop-blur-xl bg-white/75 dark:bg-stone-950/75 border-b border-stone-200/50 dark:border-stone-800/50'
      }`}
    >
      {/* Top流光分割线 */}
      <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
        <motion.div
          className="h-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #f472b6, #c084fc, #60a5fa, #34d399, transparent)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '200% 0%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* Holographic logo */}
          <NavigationButton
            href="/"
            className="flex items-center gap-3 group relative"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: EASE, duration: 0.5 }}
              className="relative"
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight holo-text group-hover:text-transparent transition-all duration-500">
                三水
              </span>
              {/* Animated underline */}
              <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 group-hover:w-full transition-all duration-700 ease-[var(--ease-out-quint)]" />
            </motion.div>
          </NavigationButton>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <NavigationButton
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-500 ease-[var(--ease-out-quint)] group ${
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
                  {/* Underline on hover */}
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-pink-500 to-violet-500 group-hover:w-full transition-all duration-500 ease-[var(--ease-out-quint)]" />
                  <span className="relative z-10">{link.label}</span>
                </NavigationButton>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <SearchDialog posts={posts} />

            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.9, rotate: theme === 'dark' ? 180 : 0 }}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 active:scale-95"
              aria-label="切换主题"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </motion.button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200"
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
            transition={{ duration: 0.4, ease: EASE }}
            className="md:hidden border-t border-stone-200/50 dark:border-stone-800/50 bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl overflow-hidden"
          >
            <nav className="px-4 py-4 space-y-1 aurora">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <NavigationButton
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      pathname === link.href
                        ? 'text-red-600 dark:text-red-400 bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-cyan-500/10 dark:from-pink-500/20 dark:via-violet-500/20 dark:to-cyan-500/20'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {link.label}
                  </NavigationButton>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}