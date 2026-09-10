import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { common as languages } from 'lowlight';
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

// 语言白名单：只注册文章围栏实际用到的语言（content/posts 全量统计，
// 见 CodeCopyInjector 语言统计），不再展开 lowlight common 全量 37 种——
// 构建期 rehype-highlight 逐围栏解析 + detect 兜底只遍历注册表，白名单越小
// 构建越快、内存越低。别名命中：ts/tsx→typescript、js→javascript、html→xml、
// text→plaintext、objc→objectivec。promql/haproxy 无接近语法，走下方
// rehypeHighlightOptions.plainText 纯文本输出（L5 裁剪，2026-09）。
const blogLanguages = {
  typescript: languages.typescript, // ts / tsx
  javascript: languages.javascript, // js
  go: languages.go,
  css: languages.css,
  bash: languages.bash,
  sql: languages.sql,
  java: languages.java,
  yaml: languages.yaml,
  ini: languages.ini,
  python: languages.python,
  objectivec: languages.objectivec, // objc
  ruby: languages.ruby,
  json: languages.json,
  diff: languages.diff,
  xml: languages.xml, // html 别名
  plaintext: languages.plaintext, // text 别名
  // common 之外的补充语言（文章围栏实际用到）：
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
