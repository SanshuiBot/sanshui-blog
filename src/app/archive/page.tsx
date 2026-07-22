import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function ArchivePage() {
  const posts = getAllPosts();
  const grouped: Record<string, typeof posts> = {};
  posts.forEach(p => { const y = new Date(p.date).getFullYear().toString(); (grouped[y]??=[]).push(p); });
  const years = Object.keys(grouped).sort((a,b)=>Number(b)-Number(a));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8 group/back"><ArrowLeft size={16} className="transition-transform group/back:-translate-x-1"/>返回首页</Link>
      <div className="mb-12"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest mb-4"><BookOpen size={12}/>归档</span><h1 className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">全部文章</h1><p className="mt-3 text-stone-500">共 {posts.length} 篇文章</p></div>
      {years.map((year)=>(
        <section key={year} className="mb-12 last:mb-0">
          <div className="relative mb-8 flex items-center gap-4"><div className="text-3xl font-bold text-stone-300 dark:text-stone-700 tracking-tight">{year}</div><div className="flex-1 h-px bg-gradient-to-r from-stone-200/50 to-transparent dark:from-stone-800/50"/></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{grouped[year]?.map((p,i)=><PostCard key={p.slug} post={p} index={i}/>)}</div>
        </section>
      ))}
    </div>
  );
}
