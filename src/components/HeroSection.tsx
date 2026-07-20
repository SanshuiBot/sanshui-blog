'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Code2, Mail, MapPin, Coffee, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { MagneticHover } from '@/components/ParallaxHover';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  const blur = useTransform(scrollY, [0, 400], [0, 8]);
  const blurFilter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <section
      style={{ viewTransitionName: 'hero-section' }}
      className="relative overflow-hidden min-h-[100dvh] flex items-center"
    >
      {/* Premium multi-layer ambient background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Primary warm orb */}
        <div className="absolute top-[-10%] right-[-5%] w-[42rem] h-[42rem] rounded-full blur-[120px] opacity-60 dark:opacity-30 animate-float"
             style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.35), rgba(234,88,12,0.18) 40%, transparent 70%)' }} />
        {/* Secondary cool orb */}
        <div className="absolute bottom-[-15%] left-[-10%] w-[36rem] h-[36rem] rounded-full blur-[100px] opacity-50 dark:opacity-25 animate-float"
             style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.28), rgba(254,215,170,0.12) 50%, transparent 75%)', animationDelay: '2s' }} />
        {/* Center soft halo */}
        <div className="absolute inset-0"
             style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 35%, rgba(254,242,226,0.4), transparent 60%)' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
             style={{
               backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
               backgroundSize: '64px 64px',
               color: 'var(--text-primary)',
               maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)',
               WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)',
             }} />
      </div>

      <motion.div
        style={{ opacity, y, filter: blurFilter }}
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
      >
        <div className="max-w-3xl">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-stone-600 dark:text-stone-300 text-xs font-medium mb-8 tracking-wide"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            正在写作中
            <Sparkles size={11} className="text-amber-500" />
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08] mb-6 text-balance"
          >
            你好，我是
            <span className="block mt-2">
              <span className="gradient-text-animated">三水</span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mb-10 text-pretty"
          >
            在这里记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.
          </motion.p>

          {/* CTA + Social */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="flex flex-wrap items-center gap-4"
          >
            <MagneticHover strength={0.15}>
              <Link
                href="#posts"
                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-medium text-sm transition-all duration-700 ease-[var(--ease-out-quint)] shadow-lg shadow-stone-900/10 dark:shadow-stone-50/10 active:scale-[0.98] hover:shadow-xl hover:shadow-stone-900/20 dark:hover:shadow-stone-50/20"
              >
                <span>浏览文章</span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 dark:bg-stone-900/15 group-hover:bg-white/25 dark:group-hover:bg-stone-900/25 transition-all duration-700 ease-[var(--ease-out-quint)]">
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            </MagneticHover>

            <div className="flex items-center gap-1">
              {[
                { icon: Code2, href: 'https://github.com/SanshuiBot', label: 'GitHub' },
                { icon: Mail, href: 'mailto:localhost6@foxmail.com', label: 'Email' },
                { icon: MapPin, href: '#', label: 'Location' },
                { icon: Coffee, href: '#', label: 'Buy Me a Coffee' },
              ].map(({ icon: Icon, href, label }) => (
                <MagneticHover key={label} strength={0.2}>
                  <Link
                    href={href}
                    aria-label={label}
                    className="p-2.5 rounded-full text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-500 ease-[var(--ease-out-quint)] active:scale-95"
                  >
                    <Icon size={18} />
                  </Link>
                </MagneticHover>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="mt-20 pt-10 border-t border-stone-200/40 dark:border-stone-800/40"
        >
          <div className="flex gap-12 sm:gap-16">
            {[
              { value: '4+', label: '文章' },
              { value: '∞', label: '想法' },
              { value: '1', label: '个作者' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: EASE }}
              >
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-400 dark:text-stone-600 pointer-events-none"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-current to-transparent" />
      </motion.div>
    </section>
  );
}
