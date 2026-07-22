"use client";
import { ExternalLink, ArrowLeft, Link2, Sparkles, Heart } from "lucide-react";
import Link from "next/link";

export default function LinksPage() {
  const friend = {
    name: "GitHub",
    url: "https://github.com/SanshuiBot",
    avatar: "/sanshui-blog/github.png",
    desc: "个人开源项目托管平台",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8 group/back">
        <ArrowLeft size={14} className="transition-transform group/back:-translate-x-1" />返回首页
      </Link>
      <div className="mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4"><Link2 size={12} />友链</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight"><span className="text-aurora">友情链接</span></h1>
        <p className="mt-3 text-gray-500">那些人，那些事</p>
      </div>
      <a href={friend.url} target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-5 p-6 rounded-2xl glass border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-1">
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 ring-1 ring-white/10 group-hover:ring-accent-violet/30 transition-all">
          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white group-hover:text-aurora transition-all truncate">{friend.name}</span>
            <ExternalLink size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-all" />
          </div>
          <p className="text-sm text-gray-500 truncate">{friend.desc}</p>
        </div>
      </a>
      <div className="mt-12 p-8 rounded-3xl border border-white/5 glass hover:border-white/10 transition-all">
        <h2 className="text-xl font-bold text-white mb-3">想交换友链？</h2>
        <p className="text-gray-400 mb-5">欢迎在 GitHub 仓库提 Issue 或发邮件给我。</p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:localhost6@foxmail.com" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:scale-105 active:scale-95 transition-transform"><Sparkles size={14} />联系我</a>
          <a href="https://github.com/SanshuiBot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm font-medium border border-white/10 hover:scale-105 active:scale-95 transition-transform hover:border-accent-violet/40"><Heart size={14} className="text-accent-pink" />GitHub</a>
        </div>
      </div>
    </div>
  );
}
