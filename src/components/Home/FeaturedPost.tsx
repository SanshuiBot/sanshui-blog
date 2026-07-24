"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRef } from "react";

interface Props { post: any }

export default function FeaturedPost({ post }: Props) {
  if (!post) return null;
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const smx = useSpring(mx, { stiffness: 100, damping: 20 });
  const smy = useSpring(my, { stiffness: 100, damping: 20 });
  const bg = useTransform([smx, smy], ([x, y]: number[]) =>
    `radial-gradient(350px circle at ${x}% ${y}%,rgba(168,85,247,0.1),rgba(255,110,199,0.05) 50%,transparent 70%)`
  );

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };
  const onLeave = () => { mx.set(50); my.set(50); };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative p-8 sm:p-12 rounded-3xl overflow-hidden border border-white/5 glass-heavy shadow-dual shadow-dual-hover group"
      >
        <motion.div
          aria-hidden
          className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{ background: bg }}
        />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent-pink/5 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-accent-violet/5 blur-[80px] pointer-events-none" />
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-pink uppercase tracking-widest mb-4">
          <Sparkles size={12} />精选文章
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 max-w-2xl">
          <Link href={`/posts/${post.slug}`} prefetch={true} className="hover:text-accent-violet transition-colors">
            {post.title}
          </Link>
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mb-6">{post.excerpt}</p>
        <Link
          href={`/posts/${post.slug}`}
          prefetch={true}
          className="inline-flex items-center gap-2 text-sm font-medium text-accent-violet hover:gap-3 transition-all hover:text-accent-pink"
        >
          阅读全文<ArrowRight size={14} />
        </Link>
      </motion.div>
    </section>
  );
}
