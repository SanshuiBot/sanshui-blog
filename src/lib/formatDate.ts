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

export function formatDate(date: string): string {
  const cached = cache.get(date);
  if (cached !== undefined) return cached;
  const s = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  cache.set(date, s);
  return s;
}
