/**
 * 文章日期纯函数 —— 生成脚本（scripts/gen-feed.js，CJS 动态 import）与
 * RSC（sitemap.ts / posts/[slug]/page.tsx）共用同一份。
 *
 * 输入均为 parse-post.mjs#normalizeDate 产出的定宽 YYYY-MM-DD（非法日期已是 ''），
 * 定宽 ISO 日期可直接按**字典序**比较大小。
 *
 * ⚠️ 禁止 Math.max(dateA, dateB)：字符串经 Number() 强转恒为 NaN，reduce 会永久
 * 回退初始值（历史回归：feed.xml 的 lastBuildDate 从最新文章日期倒退为 1970-01-01）。
 */

/**
 * 取多个 ISO(YYYY-MM-DD) 日期中的最新值（字典序）。
 * - 忽略空串/undefined/null 等非字符串入参；
 * - 全部缺省时返回 ''（调用方自行决定回退值，如 sitemap 的 '1970-01-01'）。
 *
 * @param {...(string|undefined|null)} dates 候选日期，可含缺省值（如 Post.updated）
 * @returns {string}
 */
export function latestIsoDate(...dates) {
  return dates.reduce((max, d) => (typeof d === 'string' && d > max ? d : max), '');
}

/**
 * 文章最后修订日期：date 与 updated 取较新。
 * - updated 缺省 → 回退 date；
 * - updated 早于 date（脏 frontmatter）→ 仍以 date 为准，不暴露"倒着修订"的假信号；
 * - 两者都缺 → ''。
 *
 * @param {string} date 发布日期 YYYY-MM-DD（可为 ''）
 * @param {string|undefined} [updated] 修订日期 YYYY-MM-DD（可缺省）
 * @returns {string}
 */
export function postModifiedDate(date, updated) {
  return latestIsoDate(date, updated);
}
