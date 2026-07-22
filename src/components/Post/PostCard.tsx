'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

const tagGradients = [
  'from-accent-pink/20 to-accent-rose/20',
  'from-accent-violet/20 to-accent-pink/20',
  'from-accent-blue/20 to-accent-teal/20',
  'from-accent-teal/20 to-accent-blue/20',
  'from-accent-gold/20 to-accent-rose/20',
];

export default function PostCard({ post, index }: { post: any; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50); const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 150, damping: 25 }); const sy = useSpring(my, { stiffness: 150, damping: 25 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };
  const onLeave = () => { mx.set(50); my.set(50) };

  const fmt = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="group relative h-full">
        <motion.div
          aria-hidden
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: useTransform([sx, sy], ([x, y]) =>
              `radial-gradient(250px circle at ${x}% ${y}%,rgba(168,85,247,0.2),rgba(255,110,199,0.12) 30%,transparent 60%)`
            ),
          }}
        />
        <div className="p-[1px] rounded-2xl bg-white/5 group-hover:bg-gradient-to-br group-hover:from-accent-pink/30 group-hover:via-accent-violet/20 group-hover:to-accent-blue/10 transition-all duration-500">
          <article className="relative flex flex-col h-full bg-surface rounded-2xl overflow-hidden transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl">
            <div className="h-[2px] bg-transparent group-hover:bg-gradient-to-r group-hover:from-accent-pink group-hover:via-accent-violet group-hover:to-accent-blue transition-all duration-700" />
            <div className="flex-1 p-5 sm:p-6 flex flex-col">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(post.tags ?? []).slice(0, 3).map((t: string, i: number) => (
                  <Link key={t} href={`/tags/${encodeURIComponent(t)}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${tagGradients[i % tagGradients.length]} text-gray-400`}
                  ><Tag size={9} />{t}</Link>
                ))}
              </div>
              <h2 className="text-lg font-bold text-white mb-2 group-hover:text-accent-violet transition-colors line-clamp-2 tracking-tight leading-snug">
                <Link href={`/posts/${post.slug}`} className="after:absolute after:inset-0">{post.title}</Link>
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2 flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="flex items-center gap-1.5 text-xs text-gray-600"><Clock size={11} />{fmt(post.date)}</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 group-hover:text-accent-violet transition-colors">
                  阅读<ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </motion.div>
  );
}

