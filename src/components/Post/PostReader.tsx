'use client';
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Tag, Calendar, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import readingTime from 'reading-time';

function useCopyCode() {
  const inject = useCallback((el: HTMLElement) => {
    el.querySelectorAll('pre').forEach((pre, i) => {
      if (pre.dataset.ci === 'true') return;
      pre.dataset.ci = 'true';
      pre.dataset.cid = `c${i}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', '复制');
      b.className = 'copy-btn absolute top-3 right-3 z-10';
      b.textContent = '复制';
      b.onclick = async () => {
        const c = pre.querySelector('code');
        if (!c) return;
        try { await navigator.clipboard.writeText(c.textContent ?? ''); b.textContent = '已复制!'; setTimeout(() => { b.textContent = '复制' }, 2000) } catch {}
      };
      pre.classList.add('group', 'relative');
      pre.appendChild(b);
    });
  }, []);

  useEffect(() => () => {
    document.querySelectorAll('pre[data-ci]').forEach(p => { const b = p.querySelector('.copy-btn'); if (b) p.removeChild(b) });
  }, []);

  return { inject };
}

export default function PostReader({ post }: { post: any }) {
  const rt = useMemo(() => Math.max(1, Math.ceil(readingTime(post.content, { wordsPerMinute: 300 }).minutes)), [post.content]);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const h = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const artRef = useRef<HTMLElement>(null);
  const { inject } = useCopyCode();
  useEffect(() => { if (artRef.current) inject(artRef.current) }, [inject]);

  const fmt = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
      <article ref={artRef} className="min-w-0">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors group/back">
            <ArrowLeft size={14} className="transition-transform group/back:-translate-x-1" />返回首页
          </Link>
        </motion.div>

        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((t: string) => (
              <Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-violet/10 text-gray-400 hover:bg-accent-violet/20 transition-colors">
                <Tag size={10} />{t}
              </Link>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Clock size={14} />{fmt(post.date)}</span>
            <span className="text-gray-700">&middot;</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} />预计阅读 {rt} 分钟</span>
          </div>
        </motion.header>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3 }}
          className="h-px mb-10 origin-left"
          style={{ background: 'linear-gradient(90deg,rgba(168,85,247,0.5),rgba(255,110,199,0.2),transparent)' }}
        />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="prose-article">
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }], rehypeHighlight],
              },
            }}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-16 pt-8 border-t border-white/5">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t: string) => (
              <Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-accent-violet/10 hover:text-accent-violet transition-all">
                #{t}
              </Link>
            ))}
          </div>
        </motion.div>
      </article>

      {showTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-40 p-3 rounded-full glass border border-white/5 text-gray-400 hover:text-white hover:glow-violet transition-all active:scale-95"
          aria-label="回到顶部"
        >
          <ArrowUp size={16} />
        </motion.button>
      )}
    </div>
  );
}
