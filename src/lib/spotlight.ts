/**
 * 聚光坐标写入 —— 全站唯一的 --mx/--my 写入实现（约定 #40 收口）
 * -----------------------------
 * 消费方：PostCard/CardSpotlight、PostNav、ProjectsContent、LinksContent（styles/spotlight.css 消费坐标）。
 *
 * 两份坐标，缺一不可：
 *   1. 卡片根写 px —— 供 .spotlight-glow / .spotlight-border-glow 消费（层与卡片同盒）；
 *   2. 每个染色元素按「自身盒」另写 px —— 同一份卡片坐标落到卡片中下部的小元素上时，
 *      渐变圆心会位移到元素盒外（阅读按钮/描述行照不到光）。
 *
 * 设计约束：
 *   - 节点缓存用 WeakMap（键=卡片根）：mousemove 高频路径零 querySelectorAll；
 *   - 不提供 mouseleave 复位：光晕靠 opacity 渐隐原地淡出，复位到中心会「闪一次」；
 *   - 返回卡片 rect，调用方（CardSpotlight 的 3D tilt）复用，避免重复读布局。
 */

export interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PointerLike {
  clientX: number;
  clientY: number;
}

const dyedCache = new WeakMap<HTMLElement, HTMLElement[]>();

/** 对染色元素逐个按自身盒写 --mx/--my（selector 形如 '.a, .b'） */
export function writeDyedCoords(card: HTMLElement, e: PointerLike, dyedSelector: string): void {
  let dyed = dyedCache.get(card);
  if (!dyed) {
    dyed = Array.from(card.querySelectorAll<HTMLElement>(dyedSelector));
    dyedCache.set(card, dyed);
  }
  for (const t of dyed) {
    const tr = t.getBoundingClientRect();
    t.style.setProperty('--mx', `${e.clientX - tr.left}px`);
    t.style.setProperty('--my', `${e.clientY - tr.top}px`);
  }
}

/**
 * mousemove 调用：写卡片根坐标 + 染色元素坐标，返回卡片 rect。
 * dyedSelector 省略时只写卡片根（无文字染色的卡片）。
 */
export function spotlightMove(
  card: HTMLElement,
  e: PointerLike,
  dyedSelector?: string,
): SpotlightRect {
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
  if (dyedSelector) writeDyedCoords(card, e, dyedSelector);
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}
