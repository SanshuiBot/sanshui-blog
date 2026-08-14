'use client';
import Link from 'next/link';
import { Mail, ArrowUp, Rss } from 'lucide-react';
import Github from '@/components/UI/GithubIcon';
import Tooltip from '@/components/UI/Tooltip';
import { siteConfig } from '@/lib/site';
import { navLinks } from '@/lib/navLinks';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';

export default function Footer() {
  const [showTop, setShowTop] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setShowTop(v > 500));

  return (
    <footer className="relative border-t border-white/5 mt-32">
      <div className="absolute top-0 inset-x-0 h-px overflow-hidden">
        <motion.div
          className="h-full w-[200%]"
          style={{
            background:
              'linear-gradient(90deg,transparent,rgb(var(--accent-violet-rgb)),rgb(var(--accent-pink-rgb)),rgb(var(--accent-blue-rgb)),transparent)',
            backgroundSize: '50% 100%',
          }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {showTop && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-5 left-1/2 -translate-x-1/2 z-10"
        >
          <Tooltip label="回到顶部">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-2.5 rounded-full bg-surface border border-white/10 text-gray-400 hover:text-white hover:glow-violet transition-all active:scale-95"
              aria-label="回到顶部"
            >
              <ArrowUp size={16} />
            </button>
          </Tooltip>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight text-aurora">
              {siteConfig.name}
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xs">
              记录技术思考与创作灵感。
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">
              导航
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} prefetch={link.prefetch} className="footer-link text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">
              联系
            </h3>
            <div className="space-y-3">
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link inline-flex items-center gap-2 text-sm"
              >
                <Github size={14} />
                GitHub
              </a>
              <br />
              <a
                href={siteConfig.emailHref}
                className="footer-link inline-flex items-center gap-2 text-sm"
              >
                <Mail size={14} />
                Email
              </a>
            </div>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Next.js &bull; MDX &bull; Tailwind CSS <Rss size={12} className="opacity-40" />
          </p>
        </div>
      </div>
    </footer>
  );
}
