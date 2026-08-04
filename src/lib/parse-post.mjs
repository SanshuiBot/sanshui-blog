/**
 * 文章解析契约 —— 唯一实现（纯函数，无 fs / 无 server-only）。
 *
 * 消费方：
 *  - src/lib/posts.ts（服务端读取层，RSC）
 *  - scripts/gen-posts-index.js（索引生成脚本，CJS 通过 await import 动态加载）
 *  - SearchModal 的索引类型由此结构派生
 *
 * 抽成共享模块的原因：解析规则（文件名→slug、date 规整、excerpt 兜底、tags 缺省）
 * 此前在 posts.ts 与 gen-posts-index.js 两处逐行复制，契约漂移（如 excerpt 正则
 * 误删围栏代码块、非法 date 抛 RangeError）要改两边。此文件是唯一实现。
 */
import matter from 'gray-matter';

/**
 * 解析单篇 markdown 文章（frontmatter + 正文）。
 *
 * @param {string} fileName 文件名（含扩展名），如 'react-19.md' / '深入理解.mdx'
 * @param {string} source 文件原文
 * @returns {{ slug: string, title: string, date: string, excerpt: string, tags: string[], content: string }}
 */
export function parsePostFile(fileName, source) {
  const { data, content } = matter(source);
  const slug = fileName.replace(/\.(mdx?)$/, '');
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
    excerpt:
      data.excerpt ??
      content
        .slice(0, 160)
        .replace(/[#*`\[\]]/g, '')
        .trim(),
    tags: data.tags ?? [],
    content,
  };
}
