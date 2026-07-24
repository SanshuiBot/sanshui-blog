import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPostBySlug, getAllPosts, getAdjacentPosts } from "@/lib/posts";
import { extractHeadings } from "@/lib/toc";
import PostLoading from "./loading";

const PostContentImpl = dynamic(() => import("./PostContentImpl"), {
  loading: () => <PostLoading />,
});

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

  return <PostContentImpl post={post} headings={headings} prev={prev} next={next} />;
}
