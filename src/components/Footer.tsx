'use client';
import Link from 'next/link';
import { Code2, Mail, Rss, ArrowUp } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';

export default function Footer() {
  const [show, setShow] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setShow(v > 400));

  return (
    <footer className="relative border-t border-stone-200/60 dark:border-stone-800/60 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px overflow-hidden">
        <motion.div className="h-full w-[200%]" style={{ background: 'linear-gradient(90deg,transparent,#e879f9,#818cf8,#22d3ee,transparent)', backgroundSize: '50% 100%' }} animate={{ x: ['0%','-50%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
      </div>
      {show && <motion.button initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 p-2.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all active:scale-95" aria-label="顶部"><ArrowUp size={16}/></motion.button>}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div><Link href="/" className="text-xl font-bold tracking-tight holo-text">三水</Link><p className="mt-3 text-sm text-stone-500 dark:text-stone-500 leading-relaxed max-w-xs">记录技术思考、生活感悟与创作灵感.</p></div>
          <div><h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">导航</h3><ul className="space-y-3">{['首页','归档','标签','关于','友链'].map((l,i)=>[['/', '/archive', '/tags', '/about', '/links'][i], l] as [string, string]).map(([h,l])=><li key={h}><Link href={h} className="relative text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors group"><span className="relative z-10">{l}</span><span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 group-hover:w-full transition-all duration-500 ease-quint"/></Link></li>)}</ul></div>
          <div><h3 className="text-xs font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-widest mb-4">更多</h3><ul className="space-y-3">
            {[{h:'/links',l:'友情链接',i:false},{h:'https://github.com/SanshuiBot',l:'GitHub',i:<Code2 size={14}/>,e:true},{h:'mailto:localhost6@foxmail.com',l:'Email',i:<Mail size={14}/>}].map(l=><li key={l.l}><Link href={l.h} target={l.e?'_blank':undefined} rel={l.e?'noopener noreferrer':undefined} className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors group">{l.i}<span className="relative z-10">{l.l}</span><span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 group-hover:w-full transition-all duration-500 ease-quint"/></Link></li>)}</ul></div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-200/50 dark:border-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400 dark:text-stone-600">&copy; {new Date().getFullYear()} 三水. All rights reserved.</p>
          <p className="text-xs text-stone-400 dark:text-stone-600 flex items-center gap-1">Built with Next.js &middot; MDX &middot; Tailwind CSS <Rss size={12} className="opacity-40"/></p>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">{[...Array(8)].map((_,i)=><motion.div key={i} className="absolute w-1 h-1 rounded-full" style={{left:`${10+i*11}%`,top:`${15+(i%4)*18}%`,background:['#e879f9','#818cf8','#22d3ee','#34d399'][i%4],boxShadow:`0 0 6px ${['#e879f9','#818cf8','#22d3ee','#34d399'][i%4]}`}} animate={{y:[0,-20,0],opacity:[0.1,0.4,0.1]}} transition={{duration:4+i*.7,repeat:Infinity,ease:'easeInOut',delay:i*.4}}/>)}</div>
    </footer>
  );
}
