/**
 * 顶部阅读进度条的进度计算 —— 纯函数（ScrollProgress 用）。
 * -----------------------------
 * 必须对「文档滚动高度 ≤ 视口」判零：maxScroll = scrollHeight - innerHeight
 * 为 0 时（文档不足一屏，或 iOS 上弹窗 fixed 滚动锁导致 scrollHeight 塌缩），
 * 直接除会得到 Infinity/NaN，被 clamp 后表现为「进度条瞬间填满」（历史 bug）。
 * 此时进度恒为 0。正常区间返回 [0, 1] 并双向钳制。
 */
export function calcScrollProgress(
  scrollY: number,
  scrollHeight: number,
  innerHeight: number,
): number {
  const maxScroll = scrollHeight - innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(scrollY / maxScroll, 0), 1);
}
