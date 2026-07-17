'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Code2, Mail, MapPin, Coffee } from 'lucide-react';
import Link from 'next/link';
import { MagneticHover } from '@/components/ParallaxHover';

export default function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 80]);

  return (
    <section className="relative overflow-hidden min-h-[100dvh] flex items-center">
      {/* Premium background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-red-100/60 via-orange-50/30 to-transparent dark:from-red-950/20 dark:via-orange-950/10 dark:to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-stone-100/80 to-transparent dark:from-stone-900/30 dark:to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.02)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02)_0%,transparent_60%)]" />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
      >
        <div className="max-w-3xl">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/5 dark:bg-stone-50/10 border border-stone-900/10 dark:border-stone-50/10 text-stone-500 dark:text-stone-400 text-xs font-medium mb-8 tracking-wide"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            正在写作中
          </motion.div>

          {/* Main heading - editorial style */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08] mb-6"
          >
            你好，我是
            <span className="block mt-2">
              <span className="gradient-text">三水</span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mb-10"
          >
            在这里记录技术思考、生活感悟与创作灵感。 用文字沉淀知识，用代码改变世界。
          </motion.p>

          {/* CTA + Social */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-wrap items-center gap-4"
          >
            <MagneticHover strength={0.15}>
              <Link
                href="#posts"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-medium text-sm hover:bg-stone-800 dark:hover:bg-stone-200 transition-all duration-300 shadow-lg shadow-stone-900/10 dark:shadow-stone-50/10 active:scale-[0.98]"
              >
                浏览文章
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </MagneticHover>

            <div className="flex items-center gap-1">
              {[
                { icon: Code2, href: 'https://github.com/SanshuiBot', label: 'GitHub' },
                { icon: Mail, href: 'mailto:hello@sanshui.dev', label: 'Email' },
                { icon: MapPin, href: '#', label: 'Location' },
                { icon: Coffee, href: '#', label: 'Buy Me a Coffee' },
              ].map(({ icon: Icon, href, label }) => (
                <MagneticHover key={label} strength={0.2}>
                  <Link
                    href={href}
                    aria-label={label}
                    className="p-2.5 rounded-xl text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 active:scale-95"
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-20 pt-10 border-t border-stone-200/60 dark:border-stone-800/60"
        >
          <div className="flex gap-12 sm:gap-16">
            {[
              { value: '3+', label: '文章' },
              { value: '∞', label: '想法' },
              { value: '1', label: '个作者' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
