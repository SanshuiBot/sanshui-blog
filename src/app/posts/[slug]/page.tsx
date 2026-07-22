import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getAllPosts, getAdjacentPosts } from "@/lib/posts";
import { extractHeadings } from "@/lib/toc";
import PostContent from "@/components/Post/PostContent";
import PostMeta from "@/components/Post/PostMeta";
import PostNav from "@/components/Post/PostNav";
import TableOfContents from "@/components/Post/TableOfContents";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: { title: post.title, description: post.excerpt, type: "article", tags: post.tags },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const { prev, next } = getAdjacentPosts(slug);

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
      <div className="flex gap-10">
        <div className="flex-1 min-w-0 max-w-3xl">
          <PostMeta post={post} />
          <PostContent content={post.content} />
          <PostNav
            prev={prev ? { slug: prev.slug, title: prev.title } : null}
            next={next ? { slug: next.slug, title: next.title } : null}
          />
        </div>
        <TableOfContents items={headings} />
      </div>
    </div>
  );
}
