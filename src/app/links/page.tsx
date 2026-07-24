'use client';
import { ExternalLink, ArrowLeft, Link2, Mail, Heart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LinksPage() {
  const friend = {
    name: 'GitHub',
    url: 'https://github.com/SanshuiBot',
    avatar: '/sanshui-blog/github.png',
    desc: '个人开源项目托管平台',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        返回首页
      </Link>
      <div className="mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4">
          <Link2 size={12} />
          友链
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          <span className="text-aurora">友情链接</span>
        </h1>
        <p className="mt-3 text-gray-500">那些人，那些事</p>
      </div>

      {/* GitHub friend card */}
      <motion.a
        href={friend.url}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, mass: 0.8 }}
        className="group flex items-center gap-5 p-6 rounded-2xl glass border border-white/5"
      >
        <motion.div
          className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5"
          style={{ boxShadow: '0 0 0px rgba(168,85,247,0)' }}
          whileHover={{ boxShadow: '0 0 24px rgba(168,85,247,0.25)' }}
          transition={{ type: 'spring', stiffness: 180, damping: 15 }}
        >
          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <motion.span
              className="font-semibold text-white truncate"
              whileHover={{ color: '#a855f7' }}
              transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            >
              {friend.name}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            >
              <ExternalLink size={14} className="text-gray-600" />
            </motion.span>
          </div>
          <p className="text-sm text-gray-500 truncate">{friend.desc}</p>
        </div>
      </motion.a>

      {/* Exchange card */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mt-12 p-8 rounded-3xl border border-white/5 glass"
      >
        <h2 className="text-xl font-bold text-white mb-3">想交换友链？</h2>
        <p className="text-gray-400 mb-5">欢迎在 GitHub 仓库提 Issue 或发邮件给我。</p>
        <div className="flex flex-wrap gap-3">
          <motion.a
            href="mailto:localhost6@foxmail.com"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium"
          >
            <Mail size={14} />
            联系我
          </motion.a>
          <motion.a
            href="https://github.com/SanshuiBot"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm font-medium border border-white/10"
          >
            <Heart size={14} className="text-accent-pink" />
            GitHub
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
