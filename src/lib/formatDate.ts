/**
 * 日期格式化 —— 全站唯一实现（带模块级 memo 缓存）。
 * -----------------------------
 * 之前 SearchModal（fmtCache）/ PostCard / PostMeta 各自实现同一段
 * toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })，
 * 且只有 SearchModal 做了缓存。统一收口后：
 *  - 展示格式只有这一份契约，改一处全站生效
 *  - 模块级 Map 缓存：同一 date 字符串只做一次本地化格式化，
 *    搜索结果列表每次按键重渲染时直接命中缓存
 *  - 纯函数、无 DOM、无 'server-only'，client/server 均可安全引用
 */

const cache = new Map<string, string>();

/**
 * 解析 YYYY-MM-DD 日期字符串为 {y,m,d}；不匹配返回 null（走 Date 回退）。
 * 原因：`new Date('YYYY-MM-DD')` 按 UTC 午夜解析，再交给 toLocaleDateString
 * 用**本地时区**格式化——UTC-7~-12 时区的读者会看到前一天，且构建机时区
 * ≠ 用户时区时产生 hydration mismatch。文章 date 已由 parse-post.mjs 规整为
 * YYYY-MM-DD，字符串切分结果与 zh-CN long month 格式化逐字一致。
 */
function parseISODate(date: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function formatDate(date: string): string {
  const cached = cache.get(date);
  if (cached !== undefined) return cached;
  const parts = parseISODate(date);
  const s = parts
    ? `${parts.y}年${parts.m}月${parts.d}日`
    : new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  cache.set(date, s);
  return s;
}
