import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/Post/PostCard";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function ArchivePage() {
  const posts = getAllPosts();
  const grouped: Record<string, typeof posts> = {};
  posts.forEach((p) => {
    const y = new Date(p.date).getFullYear().toString();
    (grouped[y] ??= []).push(p);
  });
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8 group/back">
        <ArrowLeft size={14} className="transition-transform group/back:-translate-x-1" />返回首页
      </Link>

      <div className="mb-14">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4">
          <BookOpen size={12} />归档
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">全部文章</h1>
        <p className="mt-3 text-gray-500">共 {posts.length} 篇文章</p>
      </div>

      {years.map((year) => (
        <section key={year} className="mb-14 last:mb-0">
          <div className="relative mb-8 flex items-center gap-5">
            <div className="text-3xl font-bold text-gray-800 tracking-tight">{year}</div>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {(grouped[year] ?? []).map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
