'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Code2, Mail, MapPin, Coffee, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { MagneticHover } from '@/components/ParallaxHover';
import MorphBlob from '@/components/MorphBlob';
import SparklesComp from '@/components/Sparkles';
import GradientText from '@/components/GradientText';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  const blur = useTransform(scrollY, [0, 400], [0, 8]);
  const blurFilter = useTransform(blur, (b) => `blur(${b}px)`);

  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Use intersection observer for initial load
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation variants with reduced motion support
  const variants = {
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 12 },
    animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
  };

  const transition = { duration: 0.6, ease: EASE };

  return (
    <section
      style={{ viewTransitionName: 'hero-section' }}
      className="relative overflow-hidden min-h-[100dvh] flex items-center"
    >
      {/* Multi-layer ambient background - Optimized with will-change */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 will-change-transform">
          {/* Primary warm orb */}
          <motion.div
            initial={false}
            animate={isVisible ? {
              x: [0, 20, 0],
              y: [0, -15, 0],
            } : {}}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-[-10%] right-[-5%] w-[42rem] h-[42rem] rounded-full blur-[120px] opacity-60 dark:opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.35), rgba(234,88,12,0.18) 40%, transparent 70%)' }}
          />
          {/* Secondary cool orb */}
          <motion.div
            initial={false}
            animate={isVisible ? {
              x: [0, -25, 0],
              y: [0, 20, 0],
            } : {}}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className="absolute bottom-[-15%] left-[-10%] w-[36rem] h-[36rem] rounded-full blur-[100px] opacity-50 dark:opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.28), rgba(254,215,170,0.12) 50%, transparent 75%)' }}
          />
        </div>
        {/* Center soft halo - Static for performance */}
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

      {/* Decorative morphing blobs */}
      <MorphBlob
        color="rgba(244, 114, 182, 0.08)"
        size={500}
        duration={20}
        className="absolute top-[10%] left-[5%] pointer-events-none"
      />
      <MorphBlob
        color="rgba(96, 165, 250, 0.06)"
        size={400}
        duration={25}
        className="absolute bottom-[15%] right-[10%] pointer-events-none"
      />

      {/* Sparkles */}
      <SparklesComp count={10} className="pointer-events-none" />

      <motion.div
        ref={containerRef}
        style={{ opacity, y, filter: blurFilter }}
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
      >
        <div className="max-w-3xl">
          {/* Status badge */}
          <motion.div
            {...variants}
            transition={transition}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-stone-600 dark:text-stone-300 text-xs font-medium mb-8 tracking-wide will-change-transform"
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
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08] mb-6 text-balance"
          >
            你好，我是
            <span className="block mt-2">
              <GradientText mode="holo" size="xl">三水</GradientText>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mb-10 text-pretty"
          >
            在这里记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.
          </motion.p>

          {/* CTA + Social */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="flex flex-wrap items-center gap-4 will-change-transform"
          >
            <MagneticHover strength={0.15}>
              <Link
                href="#posts"
                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-medium text-sm transition-all duration-700 ease-[var(--ease-out-quint)] shadow-lg shadow-stone-900/10 dark:shadow-stone-50/10 active:scale-[0.98] hover:shadow-xl hover:shadow-stone-900/20 dark:hover:shadow-stone-50/20 light-ray ripple"
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
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="mt-20 pt-10 border-t border-stone-200/40 dark:border-stone-800/40 will-change-transform"
        >
          <div className="flex gap-12 sm:gap-16">
            {[
              { value: '4+', label: '文章' },
              { value: '∞', label: '想法' },
              { value: '1', label: '个作者' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
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

      {/* Scroll indicator - Optimized */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-400 dark:text-stone-600 pointer-events-none will-change-opacity"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-current to-transparent" />
      </motion.div>
    </section>
  );
}
