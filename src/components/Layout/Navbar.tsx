'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/UI/ThemeToggle';
import SearchModal from '@/components/UI/SearchModal';

const links = [
  { href: '/', label: '首页' },
  { href: '/archive', label: '归档' },
  { href: '/tags', label: '标签' },
  { href: '/about', label: '关于' },
  { href: '/links', label: '友链' },
];

export default function Navbar({ posts }: { posts: any[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setMobileOpen(false) }, [pathname]);

  return (
    <>
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 px-4">
        <nav className={`relative flex items-center justify-between w-full max-w-4xl rounded-2xl transition-all duration-500 ${scrolled ? 'glass-heavy px-5 py-2.5' : 'glass px-5 py-3'}`}>
          <Link href="/" className="flex items-center gap-2 shrink-0"><span className="text-xl font-bold tracking-tight text-aurora">三水</span></Link>
          <div className="hidden md:flex items-center gap-0.5">
            {links.map(l => {
              const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href} className={`relative px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all duration-300 ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                  {active && <motion.span layoutId="nav-indicator" className="absolute inset-0 rounded-xl bg-white/10" transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }} />}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all" aria-label="搜索"><Search size={16} /></button>
            <ThemeToggle />
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all md:hidden" aria-label="菜单">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-ink/90 backdrop-blur-2xl" onClick={() => setMobileOpen(false)} />
            <nav className="relative flex flex-col items-center justify-center h-full gap-8">
              {links.map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ delay: i * 0.06 }}>
                  <Link href={l.href} onClick={() => setMobileOpen(false)} className={`text-3xl font-bold tracking-tight transition-all ${pathname === l.href ? 'text-aurora' : 'text-gray-400 hover:text-white'}`}>{l.label}</Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <SearchModal posts={posts} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

