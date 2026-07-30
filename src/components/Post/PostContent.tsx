import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { common } from 'lowlight';
import hljsSolidity from 'highlightjs-solidity';

// rehype-highlight v7 默认只注册 common 的 37 种语言，solidity 不在内。
// 用 languages 字段把 solidity 加进去（hljs v9 LanguageFn 兼容 lowlight v3）。
const rehypeHighlightOptions = {
  languages: { ...common, solidity: hljsSolidity.solidity },
};

export default function PostContent({ content }: { content: string }) {
  return (
    <article className="min-w-0">
      <div
        className="h-px mb-10"
        style={{
          background:
            'linear-gradient(90deg,rgb(var(--accent-violet-rgb) / 0.5),rgb(var(--accent-pink-rgb) / 0.2),transparent)',
        }}
      />
      <div className="prose-article">
        <MDXRemote
          source={content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, [rehypeHighlight, rehypeHighlightOptions]],
            },
          }}
        />
      </div>
    </article>
  );
}
