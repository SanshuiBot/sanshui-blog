'use client';
import { useMemo, useEffect, useState } from 'react';
import { ArrowLeft, Clock, Tag, Calendar, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import readingTime from 'reading-time';

interface Props {
  post: {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    tags: string[];
    content: string;
  };
}

export default function PostMeta({ post }: Props) {
  const rt = useMemo(
    () => Math.max(1, Math.ceil(readingTime(post.content, { wordsPerMinute: 300 }).minutes)),
    [post.content],
  );
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const h = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const inject = () => {
      document.querySelectorAll('article pre:not([data-ci])').forEach((pre, i) => {
        pre.setAttribute('data-ci', 'true');
        pre.setAttribute('data-cid', `c${i}`);
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '复制');
        b.className =
          'absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-all bg-black/85 text-[#d4d4d4] border border-gray-600/40 shadow-lg shadow-black/50 backdrop-blur-sm hover:bg-accent-violet/20 hover:text-accent-violet hover:border-accent-violet/30';
        b.textContent = '复制';
        b.onclick = async () => {
          const c = pre.querySelector('code');
          if (!c) return;
          try {
            await navigator.clipboard.writeText(c.textContent ?? '');
            b.textContent = '已复制!';
            setTimeout(() => {
              b.textContent = '复制';
            }, 2000);
          } catch {}
        };
        pre.classList.add('group', 'relative');
        pre.appendChild(b);
      });
    };

    // Initial injection after mount
    const timer = setTimeout(inject, 100);

    // Observe dynamically added <pre> elements (e.g. MDX lazy rendering)
    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors group/back"
        >
          <ArrowLeft size={14} className="transition-transform group/back:-translate-x-1" />
          返回首页
        </Link>
      </div>

      <header className="mb-10">
        <div className="flex flex-wrap gap-2 mb-5">
          {(post.tags ?? []).map((t: string) => (
            <Link
              key={t}
              href={`/tags/${encodeURIComponent(t)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-violet/10 text-gray-400 hover:bg-accent-violet/20 transition-colors"
            >
              <Tag size={10} />
              {t}
            </Link>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {fmt(post.date)}
          </span>
          <span className="text-gray-700">&middot;</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            预计阅读 {rt} 分钟
          </span>
        </div>
      </header>

      <div className="mt-16 pt-8 border-t border-white/5">
        <div className="flex flex-wrap gap-2">
          {(post.tags ?? []).map((t: string) => (
            <Link
              key={t}
              href={`/tags/${encodeURIComponent(t)}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-accent-violet/10 hover:text-accent-violet transition-all"
            >
              #{t}
            </Link>
          ))}
        </div>
      </div>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-40 p-3 rounded-full glass border border-white/5 text-gray-400 hover:text-white transition-all active:scale-95"
          aria-label="回到顶部"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </>
  );
}
