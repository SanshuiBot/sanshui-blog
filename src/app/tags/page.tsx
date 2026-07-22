import { Hash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getAllTags, getPostsByTag } from "@/lib/posts";

export default function TagsPage() {
  const tags = getAllTags().map((t) => ({ name: t, count: getPostsByTag(t).length }));
  const max = Math.max(...tags.map((t) => t.count), 1);
  const colors = ["#ff6ec7", "#a855f7", "#38bdf8", "#2dd4bf", "#fbbf24", "#fb7185"];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8 group/back">
        <ArrowLeft size={14} className="transition-transform group/back:-translate-x-1" />返回首页
      </Link>
      <div className="mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4"><Hash size={12} />标签</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">全部标签</h1>
        <p className="mt-3 text-gray-500">共 {tags.length} 个标签</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {tags.map((t, i) => {
          const scale = 0.75 + (t.count / max) * 0.8;
          const color = colors[i % colors.length]!;
          return (
            <Link
              key={t.name}
              href={`/tags/${encodeURIComponent(t.name)}`}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-1"
              style={{ transform: `scale(${scale})` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{t.name}</span>
              <span className="text-xs text-gray-600">({t.count})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
