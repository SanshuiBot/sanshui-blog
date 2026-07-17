import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import PageHeader from '@/components/PageHeader';
import ScrollReveal from '@/components/ScrollReveal';

export default function ArchivePage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <PageHeader title="全部文章" description={`共 ${posts.length} 篇文章`} />

      <ScrollReveal direction="up" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}