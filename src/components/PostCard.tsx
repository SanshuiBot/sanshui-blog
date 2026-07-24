'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Tag, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

const tagColors = ['from-fuchsia-500/15 to-rose-500/15','from-violet-500/15 to-purple-500/15','from-blue-500/15 to-cyan-500/15','from-emerald-500/15 to-teal-500/15','from-amber-500/15 to-orange-500/15'];

export default function PostCard({ post, index }: { post: any; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50); const my = useMotionValue(50);
  const sx = useSpring(mx,{stiffness:200,damping:30}); const sy = useSpring(my,{stiffness:200,damping:30});
  const rx = useMotionValue(0); const ry = useMotionValue(0);
  const srx = useSpring(rx,{stiffness:150,damping:18}); const sry = useSpring(ry,{stiffness:150,damping:18});
  const onMove=(e:React.MouseEvent)=>{const el=ref.current;if(!el)return;const r=el.getBoundingClientRect();mx.set(((e.clientX-r.left)/r.width)*100);my.set(((e.clientY-r.top)/r.height)*100);ry.set(((e.clientX-(r.left+r.width/2))/(r.width/2))*6);rx.set(-((e.clientY-(r.top+r.height/2))/(r.height/2))*6);};
  const onLeave=()=>{mx.set(50);my.set(50);rx.set(0);ry.set(0);};
  const fmt=(d:string)=>new Date(d).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'});

  return (
    <motion.div className="h-full" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:index*.06,duration:.7}}>
      <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{rotateX:srx,rotateY:sry,transformStyle:'preserve-3d',perspective:'1000px'}} className="group relative h-full">
        <motion.div aria-hidden className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{background:useTransform([sx,sy],([x,y])=>`radial-gradient(300px circle at ${x} ${y},rgba(244,114,182,0.25),rgba(192,132,252,0.18) 30%,rgba(96,165,250,0.12) 60%,transparent 70%)`)}}/>
        <div className="p-[1.5px] rounded-3xl bg-gradient-to-b from-stone-200/60 via-violet-200/30 to-transparent dark:from-stone-800/40 dark:via-violet-900/20 dark:to-transparent transition-all duration-700 group-hover:from-fuchsia-500/40 group-hover:via-violet-500/30 group-hover:to-cyan-500/20 h-full">
          <article className="relative flex flex-col bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-3xl overflow-hidden transition-all duration-700 group-hover:shadow-[0_0_30px_rgba(244,114,182,0.2)] group-hover:-translate-y-1 h-full">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-fuchsia-500 group-hover:via-violet-500 group-hover:to-cyan-500 transition-all duration-1000 group-hover:h-[3px] shrink-0"/>
            <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"><motion.div className="absolute inset-0" style={{background:'linear-gradient(90deg,transparent 0%,rgba(244,114,182,0.03) 45%,rgba(192,132,252,0.05) 50%,rgba(96,165,250,0.03) 55%,transparent 100%)'}} animate={{x:['-100%','200%']}} transition={{duration:4,repeat:Infinity,repeatDelay:6}}/></div>
            <div className="flex-1 p-6 sm:p-7 relative flex flex-col">
              <div className="flex flex-wrap gap-2 mb-4 min-h-[1.75rem]">{post.tags.map((t:string,i:number)=><Link key={t} href={`/tags/${encodeURIComponent(t)}`} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r ${tagColors[i%tagColors.length]} text-stone-600 dark:text-stone-400`}><Tag size={10}/>{t}</Link>)}</div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 mb-3 group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors line-clamp-2 overflow-hidden min-h-[3.5rem] sm:min-h-[4rem] tracking-tight shrink-0"><Link href={`/posts/${post.slug}`} className="after:absolute after:inset-0">{post.title}</Link></h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1 min-h-0">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800/50 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500"><Clock size={13}/>{fmt(post.date)}</div>
                <span className="group/btn relative inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                  <span>阅读</span>
                  <span className="btn-icon-wrap bg-stone-100 dark:bg-stone-800 group-hover/btn:bg-gradient-to-r group-hover/btn:from-fuchsia-500/20 group-hover/btn:to-violet-500/20"><ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-0.5"/></span>
                </span>
              </div>
            </div>
          </article>
        </div>
      </motion.div>
    </motion.div>
  );
}
