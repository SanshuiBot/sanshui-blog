/**
 * 标签胶囊渐变色板 —— PostCard（列表卡片）与 PostMeta（详情页头部）共用，
 * 保证同一文章在两处渲染出的标签颜色一致。
 * 共 5 条，第 6 个标签复用第 0 条（index % 5）：
 * 视觉上 pink→violet→blue→teal→gold 五色循环，rose 作为终点色与起点粉色呼应。
 */
export const tagGradients = [
  'from-accent-pink/20 to-accent-rose/20',
  'from-accent-violet/20 to-accent-pink/20',
  'from-accent-blue/20 to-accent-teal/20',
  'from-accent-teal/20 to-accent-blue/20',
  'from-accent-gold/20 to-accent-rose/20',
] as const;
