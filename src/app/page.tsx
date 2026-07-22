import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/Post/PostCard";
import HeroScene from "@/components/Home/HeroScene";
import StatsGrid from "@/components/Home/StatsGrid";
import FeaturedPost from "@/components/Home/FeaturedPost";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const posts = getAllPosts();
  const featured = posts[0];
  const remaining = posts.slice(1);

  return (
    <>
      <HeroScene />
      <StatsGrid />
      {featured && <FeaturedPost post={featured} />}
      <section id="posts" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">最新文章</h2>
            <p className="mt-2 text-gray-500 text-sm">共 {posts.length} 篇文章</p>
          </div>
          <Link href="/archive" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-white transition-colors group/link">
            查看全部<ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
        {remaining.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {remaining.map((p, i) => <PostCard key={p.slug} post={p} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600">暂无更多文章</div>
        )}
        <div className="sm:hidden mt-8 text-center">
          <Link href="/archive" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-white">
            查看全部文章<ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
