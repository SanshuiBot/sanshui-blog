import { Hash } from 'lucide-react'; import Link from 'next/link'; import { getAllTags, getPostsByTag } from '@/lib/posts';
export default function TagsPage() {
  const tags = getAllTags().map(t=>({n:t,c:getPostsByTag(t).length}));
  const max = Math.max(...tags.map(t=>t.c), 1);
  return (<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24"><Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-8">&larr;返回首页</Link>
  <div className="mb-12"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest mb-4"><Hash size={12}/>标签</span><h1 className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">全部标签</h1><p className="mt-3 text-stone-500">共 {tags.length} 个标签</p></div>
  <div className="flex flex-wrap gap-3 justify-center">{tags.map((t,i)=>{const s=0.8+(t.c/max)*0.8;const c=['#f472b6','#c084fc','#60a5fa','#34d399','#fbbf24','#f87171'][i%6];return(<Link key={t.n} href={`/tags/${encodeURIComponent(t.n)}`} className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full glass hover:shadow-[0_0_20px_rgba(244,114,182,0.2)] transition-all duration-500 hover:-translate-y-1" style={{transform:`scale(${s})`}}><span className="w-2 h-2 rounded-full" style={{background:c,boxShadow:`0 0 6px ${c}`}}/><span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t.n}</span><span className="text-xs text-stone-400">({t.c})</span></Link>);})}</div></div>);
}
