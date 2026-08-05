'use client';
import { useMemo, useEffect, useState } from 'react';
import { Clock, Tag, Calendar, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import ArrowLink from '@/components/UI/ArrowLink';
import readingTime from 'reading-time';
import Tooltip from '@/components/UI/Tooltip';
import CodeCopyInjector from './CodeCopyInjector';

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

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <CodeCopyInjector />

      <div className="mb-8">
        <ArrowLink
          href="/"
          dir="back"
          className="link-back inline-flex items-center gap-1.5 text-sm transition-colors duration-200 group/back"
        >
          返回首页
        </ArrowLink>
      </div>

      <header className="mb-10">
        <div className="flex flex-wrap gap-2 mb-5">
          {(post.tags ?? []).map((t: string) => (
            <Link
              key={t}
              href={`/tags/${encodeURIComponent(t)}/`}
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

      {showTop && (
        <div className="fixed bottom-6 left-6 z-40">
          <Tooltip label="回到顶部">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-3 rounded-full glass border border-white/5 text-gray-400 hover:text-white transition-all active:scale-95"
              aria-label="回到顶部"
            >
              <ArrowUp size={16} />
            </button>
          </Tooltip>
        </div>
      )}
    </>
  );
}
