"use client";
import { ArrowLeft, Mail, GitFork, Sparkles, Heart } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const skills = [
  { label: "Next.js", level: 90, color: "from-accent-pink to-accent-rose" },
  { label: "React", level: 92, color: "from-accent-violet to-accent-pink" },
  { label: "TypeScript", level: 85, color: "from-accent-blue to-accent-violet" },
  { label: "Tailwind CSS", level: 95, color: "from-accent-teal to-accent-blue" },
  { label: "Node.js", level: 80, color: "from-accent-gold to-accent-rose" },
  { label: "Python", level: 70, color: "from-accent-violet to-accent-blue" },
];

const stack = [
  { title: "前端", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion"], color: "from-accent-pink to-accent-rose" },
  { title: "后端", items: ["Node.js", "Python", "SQLite", "REST API"], color: "from-accent-violet to-accent-blue" },
  { title: "工具", items: ["Git", "Docker", "VS Code", "Vite"], color: "from-accent-teal to-accent-gold" },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8 group/back">
        <ArrowLeft size={14} className="transition-transform group/back:-translate-x-1" />返回首页
      </Link>
      <div className="relative mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-pink uppercase tracking-widest mb-4"><Sparkles size={12} />关于</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">你好，我是<span className="text-aurora">三水</span></h1>
      </div>
      <div className="prose-article mb-16">
        <p>一个热爱技术和写作的人。用文字沉淀知识，用代码改变世界。</p>
        <p>这个博客由 Next.js + MDX 构建，托管在 GitHub Pages 上。</p>
      </div>
      <div className="mb-16">
        <h2 className="text-xl font-bold text-white mb-6">技能</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {skills.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-300">{s.label}</span><span className="text-gray-600">{s.level}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${s.color}`} initial={{ width: 0 }} whileInView={{ width: `${s.level}%` }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mb-16">
        <h2 className="text-xl font-bold text-white mb-6">技术栈</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stack.map((s) => (
            <div key={s.title} className="relative p-5 rounded-2xl glass border-white/5 hover:border-white/10 transition-all overflow-hidden group">
              <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">{s.title}</h3>
              <ul className="space-y-1.5 text-sm text-gray-400">
                {s.items.map((item) => (<li key={item} className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${s.color}`} />{item}</li>))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="p-8 rounded-3xl border border-white/5 glass-heavy group hover:border-white/10 transition-all">
        <h2 className="text-xl font-bold text-white mb-3">联系我</h2>
        <p className="text-gray-400 mb-6">如果你有任何问题或想法，欢迎通过以下方式联系我。</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://github.com/SanshuiBot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:scale-105 active:scale-95 transition-transform"><GitFork size={16} />GitHub</a>
          <a href="mailto:localhost6@foxmail.com" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm font-medium border border-white/10 hover:scale-105 active:scale-95 transition-transform hover:border-accent-violet/40"><Mail size={16} />Email</a>
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm font-medium border border-white/10 hover:scale-105 active:scale-95 transition-transform hover:border-accent-pink/40"><Heart size={16} className="text-accent-pink" />赞助我</a>
        </div>
      </div>
    </div>
  );
}
