'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Code2, Mail, MapPin, Coffee } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-200/30 dark:bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-200/30 dark:bg-orange-900/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            正在写作中
          </motion.div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.1] mb-6">
            你好，我是
            <span className="block mt-1">
              <span className="gradient-text">三水</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed mb-8 max-w-2xl">
            在这里记录技术思考、生活感悟与创作灵感。
            <br className="hidden sm:block" />
            用文字沉淀知识，用代码改变世界。
          </p>

          {/* CTA + Social */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#posts"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-medium text-sm hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors duration-300 shadow-lg shadow-stone-900/10 dark:shadow-stone-50/10"
            >
              浏览文章
              <ArrowUpRight size={16} />
            </Link>

            <div className="flex items-center gap-3 ml-4">
              {[
                { icon: Code2, href: 'https://github.com/SanshuiBot', label: 'GitHub' },
                { icon: Mail, href: 'mailto:hello@sanshui.dev', label: 'Email' },
                { icon: MapPin, href: '#', label: 'Location' },
                { icon: Coffee, href: '#', label: 'Buy Me a Coffee' },
              ].map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="p-2.5 rounded-xl text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300"
                >
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-md"
        >
          {[
            { value: '3+', label: '文章' },
            { value: '∞', label: '想法' },
            { value: '1', label: '个作者' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">{stat.value}</div>
              <div className="text-sm text-stone-500 dark:text-stone-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}