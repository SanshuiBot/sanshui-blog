import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { common as languages } from 'lowlight';
import hljsSolidity from 'highlightjs-solidity';
// lowlight common 之外的补充语言（文章围栏实际用到，见 CodeCopyInjector 语言统计）：
import hljsDockerfile from 'highlight.js/lib/languages/dockerfile';
import hljsProtobuf from 'highlight.js/lib/languages/protobuf';
import hljsHttp from 'highlight.js/lib/languages/http';
import hljsGradle from 'highlight.js/lib/languages/gradle';
import hljsXml from 'highlight.js/lib/languages/xml';

// vue 无独立语法：注册 hljs 的 xml 语法（模板标签/属性上色，<script>/<style> 内嵌
// 代码自动复用已注册的 js/css）。必须剥离 xml 的 aliases——hljs registerLanguage
// 会把 grammar.aliases 重新映射到新注册名上（core.js registerAliases），若未来把
// vue 换成真正的 Vue 语法，全站 html/rss/svg 等别名围栏会未经改动就静默切换高亮。
const vueGrammar: typeof hljsXml = (hljs) => {
  const grammar = hljsXml(hljs);
  delete grammar.aliases;
  return grammar;
};

const blogLanguages = {
  ...languages,
  solidity: hljsSolidity.solidity,
  dockerfile: hljsDockerfile,
  protobuf: hljsProtobuf,
  http: hljsHttp,
  gradle: hljsGradle,
  vue: vueGrammar,
};

const rehypeHighlightOptions = {
  languages: blogLanguages,
  // promql/haproxy：无任何接近的已注册语法，走 plainText 纯文本展示。
  // code 的 language-* 类保留，标题栏语言名仍正确解析，同时避免构建期 Unknown language 告警。
  plainText: ['promql', 'haproxy'],
  // detect 只对「无 language-* 类」的裸围栏自动识别（兜底未标注的代码块）；
  // 显式标注的未注册语言由 plainText / 直接注册处理，不会触发自动识别。
  detect: true,
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
