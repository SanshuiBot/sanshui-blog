'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Search from '@/components/Search';

const links = [
  { h: '/', l: '首页' }, { h: '/archive', l: '归档' }, { h: '/tags', l: '标签' },
  { h: '/about', l: '关于' }, { h: '/links', l: '友链' },
];

export default function Header({ posts }: { posts: any[] }) {
  const { theme, setTheme } = useTheme();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <motion.nav initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} className="fixed top-0 inset-x-0 z-50 flex justify-center pt-3">
        <div className={`relative transition-all duration-700 ${open ? 'w-[calc(100%-2rem)] max-w-5xl rounded-3xl' : 'w-max rounded-full'} glass-s shadow-lg`}>
          <div className="absolute top-0 inset-x-3 h-px overflow-hidden rounded-full opacity-60">
            <motion.div className="h-full w-[200%]" style={{ background: 'linear-gradient(90deg,transparent,#e879f9,#818cf8,#22d3ee,transparent)', backgroundSize: '50% 100%' }} animate={{ x:['0%','-50%'] }} transition={{ duration:3, repeat:Infinity, ease:'linear' }} />
          </div>
          <div className={`flex items-center justify-between ${open ? 'px-5 py-3' : 'px-4 py-2.5'}`}>
            <Link href="/" className="flex items-center gap-2 shrink-0"><span className="text-lg sm:text-xl font-bold tracking-tight holo-text">三水</span></Link>
            {!open && <div className="hidden md:flex items-center gap-0.5 mx-3">{links.map(l=>{const a=path===l.h;return(<Link key={l.h} href={l.h} className={`relative px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-500 ${a?'text-fuchsia-600 dark:text-fuchsia-400':'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}`}>{a&&<motion.span layoutId="nav" className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10" transition={{type:'spring',bounce:.25,duration:.7}}/>}<span className="relative z-10">{l.l}</span></Link>);})}</div>}
            <div className="flex items-center gap-1">
              <motion.button onClick={()=>setOpen(!open)} whileTap={{scale:.9}} className="relative p-2 rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="菜单">
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <motion.span className="absolute block w-4 h-[1.5px] rounded-full bg-current" animate={open?{rotate:45,y:0}:{rotate:0,y:-4}} transition={{duration:.3}}/>
                  <motion.span className="absolute block w-4 h-[1.5px] rounded-full bg-current" animate={open?{opacity:0,x:-8}:{opacity:1,x:0}} transition={{duration:.2}}/>
                  <motion.span className="absolute block w-4 h-[1.5px] rounded-full bg-current" animate={open?{rotate:-45,y:0}:{rotate:0,y:4}} transition={{duration:.3}}/>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>{open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-2xl"><nav className="flex flex-col items-center gap-6">{links.map((l,i)=><motion.div key={l.h} initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:i*.08}}><Link href={l.h} onClick={()=>setOpen(false)} className={`text-3xl sm:text-4xl font-bold tracking-tight transition-all duration-500 ${path===l.h?'holo-text':'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}`}>{l.l}</Link></motion.div>)}</nav></motion.div>}</AnimatePresence>

      {mounted && <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="p-3 rounded-full glass-s text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 shadow-lg active:scale-95 transition-all" aria-label="主题"><Sun size={16}/></button>
        <Search posts={posts}/>
      </div>}
    </>
  );
}
