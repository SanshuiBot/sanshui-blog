'use client';
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Tag, Calendar } from 'lucide-react';
import Link from 'next/link';
import readingTime from 'reading-time';

function useCopyCode() {
  const inject = useCallback((el:HTMLElement)=>{
    el.querySelectorAll('pre').forEach((pre,i)=>{
      if(pre.dataset.ci==='true')return;
      pre.dataset.ci='true'; pre.dataset.cid=`c${i}`;
      const b=document.createElement('button');
      b.type='button'; b.setAttribute('aria-label','复制');
      b.className='copy-btn absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-all bg-stone-800/90 text-stone-300 hover:bg-stone-700';
      b.textContent='复制';
      b.onclick=async()=>{
        const c=pre.querySelector('code'); if(!c) return;
        try{ await navigator.clipboard.writeText(c.textContent??''); b.textContent='✓'; setTimeout(()=>{b.textContent='复制'},2000); }catch{}
      };
      pre.classList.add('group','relative'); pre.appendChild(b);
    });
  },[]);
  useEffect(()=>()=>{document.querySelectorAll('pre[data-ci]').forEach(p=>{const b=p.querySelector('.copy-btn');if(b)p.removeChild(b)})},[]);
  return {inject};
}

export default function PostReader({ post }: { post: any }) {
  const rt = useMemo(()=>Math.max(1,Math.ceil(readingTime(post.content,{wordsPerMinute:300}).minutes)),[post.content]);
  const [st,setSt]=useState(false);
  useEffect(()=>{const h=()=>setSt(window.scrollY>300);window.addEventListener('scroll',h,{passive:true});return()=>window.removeEventListener('scroll',h)},[]);
  const art=useRef<HTMLElement>(null);const{inject}=useCopyCode();
  useEffect(()=>{if(art.current)inject(art.current)},[inject]);
  const fmt=(d:string)=>new Date(d).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'});

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <article ref={art} className="min-w-0">
        <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="mb-10"><Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors group/back"><ArrowLeft size={14} className="transition-transform group/back:-translate-x-1"/>返回首页</Link></motion.div>
        <motion.header initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="mb-12">
          <div className="flex flex-wrap gap-2 mb-5">{post.tags.map((t:string)=><Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 text-stone-600 dark:text-stone-400"><Tag size={10}/>{t}</Link>)}</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight mb-6">{post.title}</h1>
          <div className="flex items-center gap-x-4 gap-y-2 text-sm text-stone-400 dark:text-stone-500"><span className="flex items-center gap-1.5"><Clock size={14}/> {fmt(post.date)}</span><span className="text-stone-200 dark:text-stone-700">&middot;</span><span className="flex items-center gap-1.5"><Calendar size={14}/> 预计阅读 {rt} 分钟</span></div>
        </motion.header>
        <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.3}} className="h-px bg-gradient-to-r from-fuchsia-500/50 via-violet-500/30 to-cyan-500/20 mb-12" style={{transformOrigin:'left'}}/>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}} className="prose-custom"><MDXRemote source={post.content} options={{mdxOptions:{remarkPlugins:[remarkGfm],rehypePlugins:[rehypeSlug,[rehypeAutolinkHeadings,{behavior:'wrap'}],rehypeHighlight]}}}/></motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.6}} className="mt-16 pt-8 border-t border-stone-200/60 dark:border-stone-800/60"><div className="flex flex-wrap gap-2">{post.tags.map((t:string)=><Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 text-stone-500 hover:from-fuchsia-500/20 hover:to-violet-500/20 transition-all">#{t}</Link>)}</div></motion.div>
      </article>
      {st&&<motion.button initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="fixed bottom-6 left-6 z-40 p-2.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all active:scale-95" aria-label="顶部"><ArrowLeft size={16} className="rotate-90"/></motion.button>}
    </div>
  );
}
