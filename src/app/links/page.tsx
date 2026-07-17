'use client';

import { ArrowLeft, ExternalLink, Globe } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/ScrollReveal';

const links = [
  {
    name: 'Hexo',
    url: 'https://hexo.io/zh-tw/',
    avatar: 'https://d33wubrfki0l68.cloudfront.net/6657ba50e702d84afb32fe846bed54fba1a77add/827ae/logo.svg',
    desc: '快速、简单且强大的网志框架',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/',
    avatar: 'https://i.loli.net/2020/05/14/9ZkGg8v3azHJfM1.png',
    desc: '视频网站',
  },
  {
    name: '微博',
    url: 'https://www.weibo.com/',
    avatar: 'https://i.loli.net/2020/05/14/TLJBum386vcnI1P.png',
    desc: '中国最大社交分享平台',
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/',
    avatar: 'https://i.loli.net/2020/05/14/5VyHPQqR6LWF39a.png',
    desc: '社交分享平台',
  },
];

export default function LinksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ScrollReveal direction="up">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-10">
          <ArrowLeft size={16} />
          返回首页
        </Link>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-3">
          友情链接
        </h1>
        <p className="text-stone-500 dark:text-stone-500 mb-10">
          那些人，那些事
        </p>
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
              transition={{ delay: i * 0.08 }}
              className="group flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-800">
                <img
                  src={link.avatar}
                  alt={link.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22><rect fill=%22%23e7e5e4%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23a8a29e%22>G</text></svg>';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 dark:text-stone-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                    {link.name}
                  </span>
                  <ExternalLink size={14} className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-500 truncate">{link.desc}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}