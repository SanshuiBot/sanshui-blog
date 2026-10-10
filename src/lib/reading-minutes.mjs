/**
 * 预计阅读分钟数 —— 公共纯函数（无任何依赖，client-safe）。
 * -----------------------------
 * 消费方：
 *  - src/lib/parse-post.mjs（re-export，供 gen-posts-index.js 构建期写入 posts-index.json）
 *  - src/lib/post-index.ts 的 toIndexEntry（归档/标签页 RSC 投影时现算）
 *  - src/app/posts/[slug]/page.tsx（详情页现算）
 * 列表卡片读索引字段，详情页/投影现算同一函数 —— 全站同源同值，不写死。
 *
 * 口径：中文按字符数、英文按空格分词，合计 / 300 wpm，向上取整、下限 1 分钟。
 * 剔除围栏代码块与行内代码（阅读时间按「读」计，不按「抄」计）。
 *
 * 放独立 .mjs 的原因：post-index.ts 会被客户端模块（PostCard）import，
 * 不能经由 parse-post.mjs 引入（其顶部 import gray-matter 会打进客户端 chunk）。
 */

/**
 * @param {string} content markdown 正文
 * @returns {number}
 */
export function calcReadingMinutes(content) {
  // 兜底：frontmatter 异常/调用方传 null 时软降级为 1 分钟，不崩构建
  if (typeof content !== 'string') return 1;
  const text = content
    // 围栏代码块：容忍 4+ 反引号围栏（内嵌 ``` 的 markdown 教程文），须同一长度成对闭合
    .replace(/^(`{3,})[\s\S]*?^\1[^\S\n]*$/gm, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // 链接只保留可见文字
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)?.length ?? 0;
  // 中文按字符计数后，再把 CJK 标点/全角符号剔除，避免「，。」粘住英文词
  // 被空白分词误计成 latin 词（双计虚高）
  const latinWords = text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
    .replace(/[\u3000-\u303f\uff01-\uff5e\u2018\u2019\u201c\u201d\u2026\u00b7]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil((cjk + latinWords) / 300));
}
