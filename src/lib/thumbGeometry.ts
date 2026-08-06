/**
 * 目录滚动指示条（thumb）的几何计算 —— 纯函数，无 DOM 依赖，可脱离浏览器单测。
 *
 * 原实现内联在 TableOfContents 的 update()/onScroll() 两处，公式重复维护；
 * 抽成单一实现后：内容不超出视口返回 null（无需浮层），否则按可滚比例返回
 * top/height（height 有 24px 下限）。
 */
export interface ThumbGeometry {
  top: number;
  height: number;
}

export function thumbGeometry(
  viewport: number,
  total: number,
  scrollTop: number,
): ThumbGeometry | null {
  if (total <= viewport) return null;
  const ratio = viewport / total;
  // 24px 下限：当视口本身不足 24px 时，thumb 不应超出视口，否则 top 公式
  // 会产生负值（破坏 top ∈ [0, viewport - height] 不变量）。退化为视口高度。
  const height = Math.min(Math.max(viewport * ratio, 24), viewport);
  // height === viewport 时 thumb 满铺视口，top 恒为 0（无可滚空间）。
  const scrollable = viewport - height;
  const top = scrollable > 0 ? (scrollTop / (total - viewport)) * scrollable : 0;
  return { top, height };
}
