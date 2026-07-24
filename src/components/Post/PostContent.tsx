import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";

export default function PostContent({ content }: { content: string }) {
  return (
    <article className="min-w-0">
      <div className="h-px mb-10" style={{ background: "linear-gradient(90deg,rgba(168,85,247,0.5),rgba(255,110,199,0.2),transparent)" }} />
      <div className="prose-article">
        <MDXRemote
          source={content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, rehypeHighlight],
            },
          }}
        />
      </div>
    </article>
  );
}
