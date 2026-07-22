import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import Hero from '@/components/Hero';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const posts = getAllPosts();
  const featured = posts[0];
  const remaining = posts.slice(1);

  return (
    <>
      <Hero />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {[{v:posts.length.toString(),s:'+',l:'文章'},{v:'∞',s:'',l:'想法'},{v:'1',s:'',l:'作者'},{v:'24/7',s:'',l:'在线'}].map(s=>
            <div key={s.l} className="group relative p-5 sm:p-6 rounded-2xl bg-white/60 dark:bg-stone-900/60 backdrop-blur border border-stone-200/50 dark:border-stone-800/50 hover:border-transparent transition-all duration-700 hover:shadow-[0_0_30px_rgba(244,114,182,0.12)]">
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{background:'linear-gradient(135deg,rgba(244,114,182,0.05),rgba(192,132,252,0.05),rgba(96,165,250,0.05))'}}/>
              <div className="relative"><div className="text-2xl sm:text-3xl font-bold holo-text tracking-tight">{s.v}{s.s}</div><div className="text-sm text-stone-500 dark:text-stone-500 mt-1">{s.l}</div></div>
            </div>
          )}
        </div>
      </section>

      {featured && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative p-8 sm:p-12 lg:p-16 rounded-3xl overflow-hidden bg-gradient-to-br from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 border border-stone-200/60 dark:border-stone-800/60 animated-border">
            <div className="absolute -top-20 -right-20 w-[25rem] h-[25rem] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(244,114,182,0.08),transparent 70%)',filter:'blur(60px)'}}/>
            <div className="absolute -bottom-16 -left-16 w-[20rem] h-[20rem] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(96,165,250,0.06),transparent 70%)',filter:'blur(60px)'}}/>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest mb-4"><Sparkles size={12}/>精选文章</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-4 max-w-2xl"><Link href={`/posts/${featured.slug}`} className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors">{featured.title}</Link></h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base max-w-xl mb-6">{featured.excerpt}</p>
            <Link href={`/posts/${featured.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:gap-3 transition-all">阅读全文<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5"/></Link>
          </div>
        </section>
      )}

      <section id="posts" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="flex items-end justify-between mb-10">
          <div><h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">最新文章</h2><p className="mt-2 text-stone-500 text-sm">共 {posts.length} 篇文章</p></div>
          <Link href="/archive" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors group/link">查看全部<ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5"/></Link>
        </div>
        {remaining.length>0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{remaining.map((p,i)=><PostCard key={p.slug} post={p} index={i}/>)}</div> : <div className="text-center py-16 text-stone-500">暂无更多文章</div>}
        <div className="sm:hidden mt-8 text-center"><Link href="/archive" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-400">查看全部文章<ArrowRight size={14}/></Link></div>
      </section>
    </>
  );
}
