/**
 * 文章解析契约 —— 唯一实现（纯函数，无 fs / 无 server-only）。
 *
 * 消费方：
 *  - src/lib/posts.ts（服务端读取层，RSC）
 *  - scripts/gen-posts-index.js（索引生成脚本，CJS 通过 await import 动态加载）
 *  - SearchModal 的索引类型由此结构派生
 *
 * 抽成共享模块的原因：解析规则（文件名→slug、date 规整、excerpt 兜底、tags 缺省、
 * md/mdx 过滤、日期降序排序）此前在 posts.ts 与 gen-posts-index.js 两处逐行复制，
 * 契约漂移要改两边；此文件是唯一实现，改一处即全站生效。
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
    date: normalizeDate(data.date),
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

/** 日期规整为 YYYY-MM-DD；缺失或非法（如 2026-13-45）返回空串，避免 RangeError 崩掉构建 */
function normalizeDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/** 判断文件名是否为文章源（.md / .mdx） */
export function isPostFile(fileName) {
  return fileName.endsWith('.md') || fileName.endsWith('.mdx');
}

/**
 * 按日期降序比较；date 缺失/非法（空串）按最早处理，避免 NaN 破坏排序稳定性。
 *
 * @param {{ date: string }} a
 * @param {{ date: string }} b
 */
export function sortPostsByDateDesc(a, b) {
  const ta = new Date(a.date).getTime();
  const tb = new Date(b.date).getTime();
  return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
}
