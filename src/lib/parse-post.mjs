/**
 * 文章解析契约 —— 唯一实现（纯函数，无 fs / 无 server-only）。
 *
 * 消费方：
 *  - src/lib/posts.ts（服务端读取层，RSC）
 *  - scripts/gen-posts-index.js（索引生成脚本，CJS 通过 await import 动态加载）
 *  - src/lib/post-index.ts 的 PostIndexEntry 是 SearchModal 运行时 fetch 的索引形状真相源
 *    （ADR-0004），由本模块的返回形状派生——剔除 content / readingTime
 *
 * 抽成共享模块的原因：解析规则（文件名→slug、date 规整、excerpt 兜底、tags 缺省、
 * md/mdx 过滤、日期降序排序）此前在 posts.ts 与 gen-posts-index.js 两处逐行复制，
 * 契约漂移要改两边；此文件是唯一实现，改一处即全站生效。
 */
import matter from 'gray-matter';

/**
 * 预计阅读分钟数 —— 公共纯函数（列表卡片与详情页共用同一数据源，避免两处各算一版漂移）。
 * 口径：中文按字符数、英文按空格分词，合计 / 300 wpm，向上取整、下限 1 分钟。
 * 剔除围栏代码块与行内代码（阅读时间按「读」计，不按「抄」计）。
 *
 * @param {string} content markdown 正文
 * @returns {number}
 */
export { calcReadingMinutes } from './reading-minutes.mjs';

/**
 * 解析单篇 markdown 文章（frontmatter + 正文）。
 *
 * @param {string} fileName 文件名（含扩展名），如 'react-19.md' / '深入理解.mdx'
 * @param {string} source 文件原文
 * @returns {{ slug: string, title: string, date: string, excerpt: string, tags: string[], content: string, updated?: string }}
 */
export function parsePostFile(fileName, source) {
  const { data, content } = matter(source);
  const slug = fileName.replace(/\.(mdx?)$/, '');
  const parsed = {
    slug,
    title: data.title ?? slug,
    date: normalizeDate(data.date),
    // 先剥 markdown 再折叠空白、最后截取——旧实现先 slice 再正则，会残留
    // 「文字(url)」、换行，且首行 H1 被去掉 # 后与标题重复
    excerpt: data.excerpt ? String(data.excerpt) : deriveExcerpt(content),
    // tags 归一化：YAML 误写成字符串（tags: Go）时不再被 spread 成单字标签
    tags: normalizeTags(data.tags),
    content,
  };
  // updated 可选：规整失败/缺省时不产出该键（保持旧文章形状不变）
  const updated = normalizeDate(data.updated);
  if (updated) parsed.updated = updated;
  return parsed;
}

/**
 * 从正文派生纯文本摘要：剥掉 markdown 结构 → 折叠空白 → 截取交给调用方。
 * 顺序敏感：围栏/链接等块级结构先处理，最后统一折叠空白。
 */
function deriveExcerpt(content) {
  return stripMarkdown(content).slice(0, 160);
}

/** 粗粒度 markdown → 纯文本（仅用于摘要派生，不追求完整 MD 规范覆盖） */
export function stripMarkdown(input) {
  return (
    String(input)
      // 围栏代码块整体移除（代码不是叙述性摘要）。(?:```|$) 同时兜住未闭合围栏——
      // 文章截断/书写遗漏时，从开围栏到文末的语言名与代码也必须吞掉，不得泄漏进摘要
      .replace(/```[\s\S]*?(?:```|$)/g, ' ')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // 图片/链接只留锚文本
      .replace(/^\s{0,3}#{1,6}\s+/gm, '') // ATX 标题符
      .replace(/[*_~`>]/g, '') // 粗斜体/行内代码/删除线/引用符号
      .replace(/\|/g, ' ') // 表格管道
      .replace(/<\/?[a-z][^>]*>/gi, '') // 裸 HTML 标签
      .replace(/\s+/g, ' ') // 换行/连续空白折叠为单空格
      .trim()
  );
}

/** tags 归一化为字符串数组：数组逐项字符串化去空；YAML 标量（字符串/数字/布尔，
 *  如 tags: Go / tags: 123 这种误写）包成单元素；null/缺失/对象等回退空数组 */
function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tags === 'string' || typeof tags === 'number' || typeof tags === 'boolean') {
    const t = String(tags).trim();
    return t ? [t] : [];
  }
  return [];
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
