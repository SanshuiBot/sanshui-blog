/**
 * 站点主导航链接（Navbar 桌面/移动抽屉 与 Footer 共用的单一真相源）
 * -----------------------------
 * 新增/移除导航项、调整 prefetch 策略只改这一处。
 */

export interface NavLink {
  href: string;
  label: string;
  /** 关闭预取的路由：有独有 CSS，预取会注入未使用的 CSS preload 触发线上告警 */
  prefetch?: boolean;
}

export const navLinks: NavLink[] = [
  { href: '/', label: '首页' },
  { href: '/archive/', label: '归档' },
  { href: '/tags/', label: '标签' },
  // about/links 有独有 CSS（resume-terminal / terminal-base / terminal-links），
  // 预取会注入未使用的 CSS preload 触发线上告警，故关闭（其余路由只有全局 CSS，预取无副作用）
  { href: '/about/', label: '关于', prefetch: false },
  { href: '/links/', label: '友链', prefetch: false },
];
