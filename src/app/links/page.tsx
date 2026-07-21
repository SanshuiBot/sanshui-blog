'use client';

import { ExternalLink, ArrowLeft, Link2, Sparkles, Heart } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from '@/components/TransitionLink';
import ScrollReveal from '@/components/ScrollReveal';
import GradientText from '@/components/GradientText';
import MorphBlob from '@/components/MorphBlob';
import SparklesComp from '@/components/Sparkles';

const EASE = [0.16, 1, 0.3, 1] as const;

const links = [
  {
    name: 'GitHub',
    url: 'https://github.com/SanshuiBot',
    avatar: '',
    desc: '个人开源项目托管平台',
    color: 'from-stone-700 to-stone-900 dark:from-stone-300 dark:to-stone-500',
  },
];

export default function LinksPage() {
  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up" delay={0.05}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8 group/back"
        >
          <ArrowLeft
            size={16}
            className="transition-transform duration-300 group/back:-translate-x-1"
          />
          返回首页
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <div className="mb-12 relative">
          <MorphBlob
            color="rgba(244, 114, 182, 0.08)"
            size={250}
            className="absolute -top-10 -left-10 pointer-events-none"
          />
          <SparklesComp count={6} className="pointer-events-none" />
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
            <GradientText mode="aurora">友情链接</GradientText>
          </motion.h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400">那些人，那些事</p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2}>
        <div className="space-y-4">
          {links.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, ease: EASE, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group/link relative flex items-center gap-5 p-6 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur border border-stone-200/60 dark:border-stone-800/60 hover:border-transparent transition-all duration-700 ease-[var(--ease-out-quint)] hover:shadow-holographic prism-border"
            >
              {/* Hover glow */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl opacity-0 group-hover/link:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(244,114,182,0.1), rgba(192,132,252,0.08), transparent 65%)',
                }}
              />

              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-800 ring-2 ring-stone-200/50 dark:ring-stone-700/50 group-hover/link:ring-transparent transition-all duration-500">
                <Image
                  src={link.avatar}
                  alt={link.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22><rect fill=%22%23e7e5e4%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23a8a29e%22>G</text></svg>';
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 relative">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 dark:text-stone-50 group-hover/link:holo-text transition-all duration-300 truncate">
                    {link.name}
                  </span>
                  <ExternalLink
                    size={14}
                    className="text-stone-400 opacity-0 group-hover/link:opacity-100 transition-all duration-300 group-hover/link:translate-x-0.5 -translate-x-2 flex-shrink-0"
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
        <div className="mt-12 p-8 rounded-3xl border border-stone-200/60 dark:border-stone-800/60 relative overflow-hidden aurora shimmer-surface">
          <MorphBlob
            color="rgba(96, 165, 250, 0.08)"
            size={200}
            className="absolute -bottom-10 -right-10 pointer-events-none"
          />
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-3 relative">
            想交换友链？
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-5 text-pretty relative">
            欢迎在 GitHub 仓库提 Issue 或发邮件给我，附上你的站点信息.
          </p>
          <div className="flex flex-wrap gap-3 relative">
            <a
              href="mailto:localhost6@foxmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform light-ray ripple"
            >
              <Sparkles size={14} />
              联系我
            </a>
            <a
              href="https://github.com/SanshuiBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-holographic light-ray ripple"
            >
              <Heart size={14} className="text-pink-500" />
              GitHub
            </a>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
