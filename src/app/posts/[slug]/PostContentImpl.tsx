'use client';

import PostMeta from "@/components/Post/PostMeta";
import PostContent from "@/components/Post/PostContent";
import PostNav from "@/components/Post/PostNav";
import TableOfContents from "@/components/Post/TableOfContents";
import type { Post } from "@/lib/types";
import type { TocItem } from "@/lib/toc";

interface Props {
  post: Post;
  headings: TocItem[];
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export default function PostContentImpl({ post, headings, prev, next }: Props) {
  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
      <div className="flex gap-10">
        <div className="flex-1 min-w-0 max-w-3xl">
          <PostMeta post={post} />
          <PostContent content={post.content} />
          <PostNav
            prev={prev}
            next={next}
          />
        </div>
        <TableOfContents items={headings} />
      </div>
    </div>
  );
}
