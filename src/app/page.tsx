import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import HeroSection from '@/components/HeroSection';
import Link from 'next/link';
import { ArrowRight, PenLine } from 'lucide-react';

export default function Home() {
  const posts = getAllPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <>
      <HeroSection />

      {/* Featured Post - Hero section divider */}
      {featuredPost && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="relative group rounded-2xl overflow-hidden border border-stone-200/70 dark:border-stone-800/70 bg-gradient-to-br from-stone-50 to-white dark:from-stone-900/80 dark:to-stone-950/80 p-8 sm:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-100/40 to-transparent dark:from-red-950/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
                <PenLine size={12} />
                精选文章
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-4 max-w-2xl">
                <Link href={`/posts/${featuredPost.slug}`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300">
                  {featuredPost.title}
                </Link>
              </h2>
              <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href={`/posts/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:gap-3 transition-all duration-300"
                >
                  阅读全文
                  <ArrowRight size={14} />
                </Link>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {new Date(featuredPost.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section id="posts" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              最新文章
            </h2>
            <p className="mt-2 text-stone-500 dark:text-stone-500 text-sm">
              共 {posts.length} 篇文章
            </p>
          </div>
          <Link
            href="/archive"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200"
          >
            查看全部
            <ArrowRight size={14} />
          </Link>
        </div>

        {remainingPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {remainingPosts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-stone-500 dark:text-stone-500">暂无更多文章</p>
          </div>
        )}

        {/* Mobile view all link */}
        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/archive"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
          >
            查看全部文章
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}