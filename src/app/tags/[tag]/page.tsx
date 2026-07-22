import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostsByTag, getAllTags } from "@/lib/posts";
import PostCard from "@/components/Post/PostCard";
import Link from "next/link";
import { ArrowLeft, Hash } from "lucide-react";

interface Props { params: Promise<{ tag: string }> }

export async function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag}`, description: `${tag} - Tag page` };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (posts.length === 0) notFound();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Link href="/tags" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-8 group/back">
        <ArrowLeft size={14} className="transition-transform group/back:-translate-x-1" />Back to tags
      </Link>
      <div className="mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-violet uppercase tracking-widest mb-4"><Hash size={12} />Tag</span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">#{tag}</h1>
        <p className="mt-3 text-gray-500">{posts.length} posts</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {posts.map((p, i) => <PostCard key={p.slug} post={p} index={i} />)}
      </div>
    </div>
  );
}
