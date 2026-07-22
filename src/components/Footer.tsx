'use client';

import Link from 'next/link';
import { Code2, Mail, Rss, ArrowUp } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showTop, setShowTop] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setShowTop(v > 400));

  const navLinks = [
    { href: '/', label: '首页' }, { href: '/archive', label: '归档' },
    { href: '/tags', label: '标签' }, { href: '/about', label: '关于' },
  ];
  const connectLinks = [
    { href: '/links', label: '友情链接', internal: true },
    { href: 'https://github.com/SanshuiBot', label: 'GitHub', icon: <Code2 size={14} />, external: true },
    { href: 'mailto:localhost6@foxmail.com', label: 'Email', icon: <Mail size={14} /> },
  ];

  return (
    <footer style={{ viewTransitionName: 'site-footer' }} className="relative border-t border-stone-200/60 dark:border-stone-800/60 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, transparent, #f472b6, #c084fc, #60a5fa, #34d399, transparent)', backgroundSize: '200% 100%' }} animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
      </div>

      {showTop && (
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 p-2.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:shadow-lg hover:shadow-iridescent/30 transition-all duration-300 active:scale-95" aria-label="回到顶部"
        ><ArrowUp size={16} /></motion.button>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="sm:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight holo-text">三水</Link>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-500 leading-relaxed max-w-xs">记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">导航</h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="relative text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-300 group">
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-pink-500 to-violet-500 group-hover:w-full transition-all duration-500 ease-[var(--ease-out-quint)]" />
                </Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">更多</h3>
            <ul className="space-y-3">
              {connectLinks.map((link) => (
                <li key={link.label}><Link href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-300 group"
                >{link.icon}<span className="relative z-10">{link.label}</span>
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-pink-500 to-violet-500 group-hover:w-full transition-all duration-500 ease-[var(--ease-out-quint)]" />
                </Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-200/50 dark:border-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400 dark:text-stone-600">&copy; {currentYear} 三水. All rights reserved.</p>
          <p className="text-xs text-stone-400 dark:text-stone-600 flex items-center gap-1">Built with Next.js &middot; MDX &middot; Tailwind CSS <Rss size={12} className="opacity-40" /></p>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 rounded-full" style={{ left: `${10 + i * 11}%`, top: `${15 + (i % 4) * 18}%`, background: ['#f472b6', '#c084fc', '#60a5fa', '#34d399'][i % 4], boxShadow: `0 0 6px ${['#f472b6', '#c084fc', '#60a5fa', '#34d399'][i % 4]}` }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }} />
        ))}
      </div>
    </footer>
  );
}
