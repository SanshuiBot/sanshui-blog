"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export default function PostNav({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="上下篇导航">
      {prev ? (
        <Link
          href={`/posts/${prev.slug}`}
          className="group flex items-start gap-3 p-4 rounded-xl glass border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5"
        >
          <ChevronLeft size={18} className="mt-0.5 text-gray-500 group-hover:text-accent-violet shrink-0 transition-colors" />
          <div className="min-w-0">
            <div className="text-xs text-gray-600 mb-1">上一篇</div>
            <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">{prev.title}</div>
          </div>
        </Link>
      ) : <div />}
      {next ? (
        <Link
          href={`/posts/${next.slug}`}
          className="group flex items-start justify-end gap-3 p-4 rounded-xl glass border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5 sm:col-start-2"
        >
          <div className="min-w-0 text-right">
            <div className="text-xs text-gray-600 mb-1">下一篇</div>
            <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">{next.title}</div>
          </div>
          <ChevronRight size={18} className="mt-0.5 text-gray-500 group-hover:text-accent-violet shrink-0 transition-colors" />
        </Link>
      ) : <div />}
    </nav>
  );
}
