'use client';

import { ExternalLink, ArrowLeft, Link2 } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

const EASE = [0.16, 1, 0.3, 1] as const;

const links = [
  {
    name: 'GitHub',
    url: 'https://github.com/SanshuiBot',
    avatar: 'github.png',
    desc: '个人开源项目托管平台',
  },
];

export default function LinksPage() {
  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up" delay={0.05}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <div className="mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
            <Link2 size={12} />
            友链
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: EASE, duration: 0.6 }}
            style={{ viewTransitionName: 'page-title' }}
            className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight text-balance"
          >
            友情链接
          </motion.h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400">那些人，那些事</p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2}>
        <div className="grid gap-4">
          {links.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, ease: EASE, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all duration-300"
            >
              {/* Hover glow */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(200px circle at 50% 50%, rgba(220,38,38,0.08), transparent 65%)',
                }}
              />
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-800">
                <Image
                  src={link.avatar}
                  alt={link.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22><rect fill=%22%23e7e5e4%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23a8a29e%22>G</text></svg>';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 relative">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 dark:text-stone-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                    {link.name}
                  </span>
                  <ExternalLink
                    size={14}
                    className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  />
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-500 truncate">{link.desc}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal direction="up" delay={0.3}>
        <div className="mt-12 p-8 rounded-3xl gradient-border-soft text-center">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-3">
            想交换友链？
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-5 text-pretty">
            欢迎在 GitHub 仓库提 Issue 或发邮件给我，附上你的站点信息.
          </p>
          <a
            href="mailto:localhost6@foxmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform"
          >
            联系我
          </a>
        </div>
      </ScrollReveal>
    </div>
  );
}
