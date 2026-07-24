"use client";
import Link from "next/link";
import { Code2, Mail, ArrowUp, Rss } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
  { href: "/links", label: "友链" },
];

export default function Footer() {
  const [showTop, setShowTop] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setShowTop(v > 500));

  return (
    <footer className="relative border-t border-white/5 mt-32">
      <div className="absolute top-0 inset-x-0 h-px overflow-hidden">
        <motion.div className="h-full w-[200%]" style={{ background: "linear-gradient(90deg,transparent,#a855f7,#ff6ec7,#38bdf8,transparent)", backgroundSize: "50% 100%" }}
          animate={{ x: ["0%", "-50%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
      </div>

      {showTop && (
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 p-2.5 rounded-full bg-surface border border-white/10 text-gray-400 hover:text-white hover:glow-violet transition-all active:scale-95"
          aria-label="回到顶部"><ArrowUp size={16} /></motion.button>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight text-aurora">三水</Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xs">记录技术思考与创作灵感。</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">导航</h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm"
                    style={{ color: '#78716c', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#a855f7' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#78716c' }}
                  >{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">联系</h3>
            <div className="space-y-3">
              <a href="https://github.com/SanshuiBot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm"
                style={{ color: '#78716c', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a855f7' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#78716c' }}
              ><Code2 size={14} />GitHub</a>
              <br />
              <a href="mailto:localhost6@foxmail.com" className="inline-flex items-center gap-2 text-sm"
                style={{ color: '#78716c', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a855f7' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#78716c' }}
              ><Mail size={14} />Email</a>
            </div>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} 三水. All rights reserved.</p>
          <p className="text-xs text-gray-600 flex items-center gap-1">Next.js &bull; MDX &bull; Tailwind CSS <Rss size={12} className="opacity-40" /></p>
        </div>
      </div>
    </footer>
  );
}
