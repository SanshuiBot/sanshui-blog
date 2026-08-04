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
  const height = Math.max(viewport * ratio, 24);
  const top = (scrollTop / (total - viewport)) * (viewport - height);
  return { top, height };
}
