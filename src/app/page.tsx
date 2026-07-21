import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import HeroSection from '@/components/HeroSection';
import ScrollReveal from '@/components/ScrollReveal';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import AuroraDivider from '@/components/AuroraDivider';
import SparklesComp from '@/components/Sparkles';
import MorphBlob from '@/components/MorphBlob';

export default function Home() {
  const posts = getAllPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <>
      <HeroSection />

      {/* Aurora divider */}
      <AuroraDivider height={60} />

      {/* Featured Post */}
      {featuredPost && (
        <ScrollReveal direction="up">
          <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
            <div className="relative rounded-3xl overflow-hidden border border-stone-200/70 dark:border-stone-800/70 aurora shimmer-surface">
              <MorphBlob
                color="rgba(244, 114, 182, 0.08)"
                size={400}
                duration={15}
                className="absolute -top-20 -right-20 pointer-events-none"
              />
              <MorphBlob
                color="rgba(96, 165, 250, 0.06)"
                size={300}
                duration={18}
                className="absolute -bottom-16 -left-16 pointer-events-none"
              />

              <div className="relative p-8 sm:p-12 lg:p-16">
                <SparklesComp count={8} className="pointer-events-none" />

                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-widest mb-4">
                  <Sparkles size={12} />
                  精选文章
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-4 max-w-2xl">
                  <Link
                    href={`/posts/${featuredPost.slug}`}
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300"
                  >
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/posts/${featuredPost.slug}`}
                    className="group/light inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:gap-3 transition-all duration-300"
                  >
                    阅读全文
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover/light:translate-x-0.5 group-hover/light:-translate-y-0.5" />
                  </Link>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {new Date(featuredPost.date).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Stats section */}
      <ScrollReveal direction="up" delay={0.05}>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: posts.length.toString(), suffix: '+', label: '文章' },
              { value: '∞', label: '想法' },
              { value: '1', label: '个作者' },
              { value: '24', label: '小时在线' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group/stat relative p-5 sm:p-6 rounded-2xl bg-white/60 dark:bg-stone-900/60 backdrop-blur border border-stone-200/50 dark:border-stone-800/50 hover:border-transparent transition-all duration-700 ease-[var(--ease-out-quint)] hover:shadow-holographic"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(244,114,182,0.05), rgba(192,132,252,0.05), rgba(96,165,250,0.05))',
                    borderRadius: 'var(--radius-xl)',
                  }}
                />
                <div className="relative">
                  <div className="text-2xl sm:text-3xl font-bold holo-text-static tracking-tight">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-500 mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Latest Posts Grid */}
      <ScrollReveal direction="up" delay={0.1}>
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
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors duration-200 group/link"
            >
              查看全部
              <ArrowRight size={14} className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
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
      </ScrollReveal>
    </>
  );
}
