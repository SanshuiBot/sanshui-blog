'use client';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Code2, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

export default function Hero() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, 60]);
  const pref = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const social = [
    { icon: Code2, href: 'https://github.com/SanshuiBot', label: 'GitHub' },
    { icon: Mail, href: 'mailto:localhost6@foxmail.com', label: 'Email' },
    { icon: MapPin, href: '#', label: 'Location' },
  ];

  return (
    <section className="relative overflow-hidden min-h-dvh flex items-center">
      {/* Atmosphere */}
      <div className="absolute -top-40 -right-40 w-[50rem] h-[50rem] rounded-full opacity-30 dark:opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(244,114,182,0.3),rgba(192,132,252,0.15) 40%,transparent 70%)', filter: 'blur(100px)' }} />
      <div className="absolute -bottom-40 -left-40 w-[45rem] h-[45rem] rounded-full opacity-25 dark:opacity-12 pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(96,165,250,0.25),rgba(34,211,238,0.1) 40%,transparent 70%)', filter: 'blur(100px)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(90deg,currentColor 1px,transparent 1px),linear-gradient(0deg,currentColor 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <motion.div ref={ref} style={{ opacity, y }} className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          <motion.div initial={pref?{}:{opacity:0,y:12}} animate={pref?{}:{opacity:1,y:0}} className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-stone-600 dark:text-stone-300 text-xs font-medium">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75"/><span className="relative rounded-full h-2 w-2 bg-emerald-500"/></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 pulse-ring inline-block" />
              写作中
            </span>
          </motion.div>

          <motion.h1 initial={pref?{}:{opacity:0,y:24}} animate={pref?{}:{opacity:1,y:0}} transition={{duration:.7}} className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.05] mb-6 text-balance">
            你好，我是<span className="block mt-2 holo-text neon-text">三水</span>
          </motion.h1>

          <motion.p initial={pref?{}:{opacity:0,y:16}} animate={pref?{}:{opacity:1,y:0}} transition={{duration:.6,delay:.15}} className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mb-10">
            记录技术思考、生活感悟与创作灵感. 用文字沉淀知识，用代码改变世界.
          </motion.p>

          <motion.div initial={pref?{}:{opacity:0,y:16}} animate={pref?{}:{opacity:1,y:0}} transition={{duration:.6,delay:.25}} className="flex flex-wrap items-center gap-4">
            <Link href="#posts" className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-medium text-sm active:scale-[0.98] hover:shadow-2xl shadow-lg animated-border">
              <span>浏览文章</span>
              <span className="btn-icon-wrap bg-white/15 dark:bg-stone-900/15 group-hover:bg-white/25 dark:group-hover:bg-stone-900/25 group-hover:translate-x-0.5 transition-all duration-500"><ArrowUpRight size={14} className="group-hover:translate-x-[0.5px] group-hover:-translate-y-[0.5px] transition-transform"/></span>
            </Link>
            <div className="flex items-center gap-1">
              {social.map(({icon:Icon,href,label})=><Link key={label} href={href} aria-label={label} className="p-2.5 rounded-full text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95"><Icon size={18}/></Link>)}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
