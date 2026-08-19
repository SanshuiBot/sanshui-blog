'use client';
import Link from 'next/link';
import { Mail, Rss } from 'lucide-react';
import { motion } from 'framer-motion';
import Github from '@/components/UI/GithubIcon';
import BackToTop from '@/components/UI/BackToTop';
import { usePrefersReducedMotion } from '@/components/UI/usePrefersReducedMotion';
import { siteConfig } from '@/lib/site';
import { navLinks } from '@/lib/navLinks';
import { withBase } from '@/lib/basePath';

export default function Footer() {
  const reduced = usePrefersReducedMotion();

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
          animate={reduced ? { x: '0%' } : { x: ['0%', '-50%'] }}
          transition={reduced ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* 回到顶部：滚动超过 500px 出现（定位/显隐统一收口在 BackToTop） */}
      <BackToTop threshold={500} className="absolute -top-5 left-1/2 -translate-x-1/2 z-10" />

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
            {/* 链接用 flex gap 对齐，不用 <br /> 硬换行 */}
            <div className="flex flex-col gap-3">
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link inline-flex items-center gap-2 text-sm"
              >
                <Github size={14} />
                GitHub
              </a>
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
            &copy; {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Next.js &bull; MDX &bull; Tailwind CSS
            {/* RSS 订阅真链接（feed.xml 由 scripts/gen-feed.js 生成） */}
            <Link
              href={withBase('/feed.xml')}
              aria-label="RSS 订阅"
              className="footer-link inline-flex text-gray-500 hover:text-accent-violet transition-colors"
            >
              <Rss size={12} />
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
