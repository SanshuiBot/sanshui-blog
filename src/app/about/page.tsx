import { ArrowLeft, Mail, Code2, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';

const skills = [
  { label: 'Next.js', level: 90 }, { label: 'React', level: 92 }, { label: 'TypeScript', level: 85 },
  { label: 'Tailwind CSS', level: 95 }, { label: 'Node.js', level: 80 }, { label: 'Python', level: 70 },
];
const stack = [
  { title: '前端', items: ['Next.js','React','TypeScript','Tailwind CSS','framer-motion'], color: 'from-fuchsia-500 to-rose-500' },
  { title: '后端', items: ['Node.js','Python','SQLite','REST API'], color: 'from-violet-500 to-purple-500' },
  { title: '工具', items: ['Git','Docker','VS Code','Vite'], color: 'from-blue-500 to-cyan-500' },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8 group/back"><ArrowLeft size={16} className="transition-transform group/back:-translate-x-1"/>返回首页</Link>
      <div className="relative mb-12"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest mb-4"><Sparkles size={12}/>关于</span><h1 className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">你好，我是 <span className="holo-text">三水</span></h1></div>
      <div className="prose-custom space-y-6 mb-16"><p>一个热爱技术和写作的人. 用文字沉淀知识，用代码改变世界.</p><p>这个博客用 Next.js + MDX 构建，托管在 GitHub Pages 上.</p></div>
      <div className="mb-16"><h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-6">技能</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{skills.map(s=><div key={s.label}><div className="flex justify-between text-sm mb-2"><span className="font-medium text-stone-700 dark:text-stone-300">{s.label}</span><span className="text-stone-400">{s.level}%</span></div><div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500" style={{width:`${s.level}%`}}/></div></div>)}</div></div>
      <div className="mb-16"><h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-6">技术栈</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{stack.map(s=><div key={s.title} className="relative p-5 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur border border-stone-200/60 dark:border-stone-800/60 hover:shadow-[0_0_30px_rgba(244,114,182,0.1)] transition-all overflow-hidden"><div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${s.color} opacity-0 hover:opacity-100 transition-opacity`}/><h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3 uppercase tracking-widest">{s.title}</h3><ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">{s.items.map(i=><li key={i} className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${s.color}`}/>{i}</li>)}</ul></div>)}</div></div>
      <div className="p-8 rounded-3xl border border-stone-200/60 dark:border-stone-800/60 bg-gradient-to-br from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 animated-border">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-3">联系我</h2>
        <p className="text-stone-600 dark:text-stone-400 mb-6">如果你有任何问题或想法，欢迎通过以下方式联系我.</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://github.com/SanshuiBot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform"><Code2 size={16}/>GitHub</a>
          <a href="mailto:localhost6@foxmail.com" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform"><Mail size={16}/>Email</a>
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-800 hover:scale-105 active:scale-95 transition-transform hover:border-fuchsia-300 dark:hover:border-fuchsia-700"><Heart size={16} className="text-fuchsia-500"/>赞助我</a>
        </div>
      </div>
    </div>
  );
}
