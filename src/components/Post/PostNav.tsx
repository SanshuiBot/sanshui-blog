"use client";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  prev: { slug: string; title: string } | null;
}

export default function PostNav({ prev }: Props) {
  if (!prev) return null;

  return (
    <nav className="mt-16" aria-label="上一篇导航">
      <Link
        href={`/posts/${prev.slug}`}
        className="group flex items-start gap-3 p-4 rounded-xl glass border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5 max-w-md"
      >
        <ChevronLeft size={18} className="mt-0.5 text-gray-500 group-hover:text-accent-violet shrink-0 transition-colors" />
        <div className="min-w-0">
          <div className="text-xs text-gray-600 mb-1">上一篇</div>
          <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">{prev.title}</div>
        </div>
      </Link>
    </nav>
  );
}
