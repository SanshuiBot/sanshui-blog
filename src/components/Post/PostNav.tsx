"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export default function PostNav({ prev, next }: Props) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="上下篇导航">
      {prev ? (
        <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
          <Link
            href={`/posts/${prev.slug}`}
            className="group flex items-start gap-3 p-4 rounded-xl glass border border-white/5 hover:border-white/20"
          >
            <motion.span whileHover={{ x: -2 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
              <ChevronLeft size={18} className="mt-0.5 text-gray-500 group-hover:text-accent-violet transition-colors shrink-0" />
            </motion.span>
            <div className="min-w-0">
              <div className="text-xs text-gray-600 mb-1">上一篇</div>
              <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">{prev.title}</div>
            </div>
          </Link>
        </motion.div>
      ) : <div />}
      {next ? (
        <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="sm:col-start-2">
          <Link
            href={`/posts/${next.slug}`}
            className="group flex items-start justify-end gap-3 p-4 rounded-xl glass border border-white/5 hover:border-white/20"
          >
            <div className="min-w-0 text-right">
              <div className="text-xs text-gray-600 mb-1">下一篇</div>
              <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">{next.title}</div>
            </div>
            <motion.span whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
              <ChevronRight size={18} className="mt-0.5 text-gray-500 group-hover:text-accent-violet transition-colors shrink-0" />
            </motion.span>
          </Link>
        </motion.div>
      ) : <div />}
    </nav>
  );
}
