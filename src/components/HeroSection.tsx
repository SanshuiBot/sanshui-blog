'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Code2, Mail, MapPin, Coffee } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import MorphBlob from '@/components/MorphBlob';
import Sparkles from '@/components/Sparkles';
import GradientText from '@/components/GradientText';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  const blur = useTransform(scrollY, [0, 400], [0, 10]);
  const prefersRM = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const social = [
    { icon: Code2, href: 'https://github.com/SanshuiBot', label: 'GitHub' },
    { icon: Mail, href: 'mailto:localhost6@foxmail.com', label: 'Email' },
    { icon: MapPin, href: '#', label: 'Location' },
    { icon: Coffee, href: '#', label: 'Buy Me a Coffee' },
  ];

  return (
    <section style={{ viewTransitionName: 'hero-section' }} className="relative overflow-hidden min-h-[100dvh] flex items-center">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '64px 64px',
          color: 'var(--text-primary)', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)',
        }} />
      </div>
      <MorphBlob color="rgba(244, 114, 182, 0.1)" size={500} duration={20} className="absolute top-[5%] left-[2%] pointer-events-none" />
      <MorphBlob color="rgba(96, 165, 250, 0.08)" size={420} duration={25} className="absolute bottom-[10%] right-[8%] pointer-events-none" />
      <MorphBlob color="rgba(52, 211, 153, 0.06)" size={350} duration={18} className="absolute top-[55%] left-[60%] pointer-events-none" />
      <Sparkles count={15} className="pointer-events-none" shapes={['dot', 'star']} />

      <div className="absolute top-[-10%] right-[-5%] w-[42rem] h-[42rem] rounded-full blur-[120px] opacity-50 dark:opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.25), rgba(234,88,12,0.12) 40%, transparent 70%)' }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[36rem] h-[36rem] rounded-full blur-[100px] opacity-40 dark:opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.2), rgba(254,215,170,0.08) 50%, transparent 75%)' }} />

      <motion.div ref={ref} style={{ opacity, y, filter: blur ? `blur(${blur}px)` : 'none' }} className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <motion.div initial={prefersRM ? {} : { opacity: 0, y: 12 }} animate={prefersRM ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-stone-600 dark:text-stone-300 text-xs font-medium mb-8 tracking-wide">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
              正在写作中
            </span>
          </motion.div>

          <motion.h1 initial={prefersRM ? {} : { opacity: 0, y: 24 }} animate={prefersRM ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08] mb-6 text-balance"
          >
            你好，我是<span className="block mt-2"><GradientText mode="holo" size="xl" glow>三水</GradientText></span>
          </motion.h1>

          <motion.p initial={prefersRM ? {} : { opacity: 0, y: 16 }} animate={prefersRM ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mb-10 text-pretty"
          >
            在这里记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.
          </motion.p>

          <motion.div initial={prefersRM ? {} : { opacity: 0, y: 16 }} animate={prefersRM ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link href="#posts" className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-medium text-sm transition-all duration-700 ease-[var(--ease-out-quint)] shadow-lg shadow-stone-900/10 dark:shadow-stone-50/10 active:scale-[0.98] hover:shadow-xl hover:shadow-stone-900/20 dark:hover:shadow-stone-50/20 light-ray">
              <span>浏览文章</span>
              <span className="btn-icon-wrap bg-white/15 dark:bg-stone-900/15 group-hover:bg-white/25 dark:group-hover:bg-stone-900/25 group-hover:translate-x-0.5 transition-all duration-700 ease-[var(--ease-out-quint)]">
                <ArrowUpRight size={14} className="group-hover:translate-x-[0.5px] group-hover:-translate-y-[0.5px] transition-transform duration-700" />
              </span>
            </Link>
            <div className="flex items-center gap-1">
              {social.map(({ icon: Icon, href, label }) => (
                <Link key={label} href={href} aria-label={label} className="p-2.5 rounded-full text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-500 ease-[var(--ease-out-quint)] active:scale-95">
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={prefersRM ? {} : { opacity: 0, y: 24 }} animate={prefersRM ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="mt-20 pt-10 border-t border-stone-200/40 dark:border-stone-800/40"
        >
          <div className="flex gap-12 sm:gap-16">
            {[{ value: '10+', label: '文章' }, { value: '∞', label: '想法' }, { value: '1', label: '作者' }].map((stat, i) => (
              <motion.div key={stat.label} initial={prefersRM ? {} : { opacity: 0, y: 10 }} animate={prefersRM ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: EASE }}>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">{stat.value}</div>
                <div className="text-sm text-stone-500 dark:text-stone-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
