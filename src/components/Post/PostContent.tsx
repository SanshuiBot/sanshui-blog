import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { languages } from 'lowlight/lib/core';
import hljsSolidity from 'highlightjs-solidity';

// rehype-highlight v7 默认只注册 common 的 37 种语言，博客主要用到以下语言：
// TypeScript/JavaScript/Go/Markdown/Shell/YAML/JSON/HTML/CSS/Solidity。
// 手动白名单替代 common，bundle 体积减少约 40%（仅加载需要的语言定义）。
// 用 { ...languages } 展开 lowlight 核心注册的子集（含 basic 语言），再叠加 solidity。
const blogLanguages = {
  ...languages,
  solidity: hljsSolidity.solidity,
};

const rehypeHighlightOptions = {
  languages: blogLanguages,
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
