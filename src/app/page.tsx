import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import HeroSection from '@/components/HeroSection';

export default function Home() {
  const posts = getAllPosts();

  return (
    <>
      <HeroSection />

      {/* Posts Section */}
      <section id="posts" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              最新文章
            </h2>
            <p className="mt-2 text-stone-500 dark:text-stone-500 text-sm">
              {posts.length} 篇文章
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
