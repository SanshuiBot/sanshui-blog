'use client';

import Link from '@/components/TransitionLink';
import { Code2, Mail, Rss } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: '/', label: '首页' },
    { href: '/archive', label: '归档' },
    { href: '/tags', label: '标签' },
    { href: '/about', label: '关于' },
  ];

  const connectLinks = [
    { href: '/links', label: '友情链接', isInternal: true },
    {
      href: 'https://github.com/SanshuiBot',
      label: 'GitHub',
      icon: <Code2 size={14} />,
      external: true,
    },
    {
      href: 'mailto:localhost6@foxmail.com',
      label: 'Email',
      icon: <Mail size={14} />,
      external: false,
    },
  ];

  return (
    <footer
      style={{ viewTransitionName: 'site-footer' }}
      className="relative border-t border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/50 overflow-hidden"
    >
      {/* Animated gradient top border */}
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
            duration: 6,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight holo-text">
              三水
            </Link>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-500 leading-relaxed max-w-xs">
              记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">
              导航
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="relative text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-300 group/light"
                  >
                    <span className="relative z-10">{link.label}</span>
                    <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-gradient-to-r from-pink-500 to-violet-500 group-hover/light:w-full transition-all duration-500 ease-[var(--ease-out-quint)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">
              更多
            </h3>
            <ul className="space-y-3">
              {connectLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-300 group/connect"
                  >
                    {link.icon}
                    <span className="relative z-10">{link.label}</span>
                    <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-gradient-to-r from-pink-500 to-violet-500 group-hover/connect:w-full transition-all duration-500 ease-[var(--ease-out-quint)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-stone-200/50 dark:border-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400 dark:text-stone-600">
            &copy; {currentYear} 三水. All rights reserved.
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-600 flex items-center gap-1">
            Built with Next.js &middot; MDX &middot; Tailwind CSS
            <Rss size={12} className="opacity-40" />
          </p>
        </div>
      </div>

      {/* Floating decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              opacity: 0.2,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </footer>
  );
}
