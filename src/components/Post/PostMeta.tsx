'use client';
import { Clock, Tag, Calendar } from 'lucide-react';
import Link from 'next/link';
import ArrowLink from '@/components/UI/ArrowLink';
import BackToTop from '@/components/UI/BackToTop';
import CodeCopyInjector from './CodeCopyInjector';
import { formatDate } from '@/lib/formatDate';
import type { PostIndexEntry } from '@/lib/post-index';

interface Props {
  post: PostIndexEntry;
  /** 服务端算好的预计阅读分钟数（避免把全文 content 透传给 client 组件） */
  readingMinutes: number;
}

export default function PostMeta({ post, readingMinutes }: Props) {
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-violet/10 text-stone-600 hover:bg-accent-violet/20 dark:text-gray-400 transition-colors"
            >
              <Tag size={10} />
              {t}
            </Link>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight mb-6">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {formatDate(post.date)}
          </span>
          <span className="text-fg-dim">&middot;</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            预计阅读 {readingMinutes} 分钟
          </span>
        </div>
      </header>

      {/* 回到顶部：滚动超过 400px 出现（定位/显隐统一收口在 BackToTop） */}
      <BackToTop threshold={400} className="fixed bottom-6 left-6 z-40" />
    </>
  );
}
