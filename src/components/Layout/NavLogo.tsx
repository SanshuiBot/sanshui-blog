/**
 * 导航栏 Logo —— 极光三色波纹
 * -----------------------------
 * 三层水波纹形状静止，stop-color 用 rgb(var(--accent-*-rgb)) CSS 变量，
 * 切换 Accent 主题（Aurora/Emerald/Sunset/Ocean/Sakura/自定义）时三色自动联动。
 *
 * 纯静态 SVG，无动画——避免 Framer Motion animate offset 触发
 * "Expected number or percentage, undefined" 报错（motion-dom SVG 渲染缺陷）。
 * stop-color 走 CSS 变量，不经过 Framer inline style，主题切换安全。
 */
export default function NavLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={22}
      height={22}
      role="img"
      aria-label="三水"
      className="nav-logo shrink-0"
    >
      <defs>
        <linearGradient id="auroraLogo" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(var(--accent-violet-rgb))" />
          <stop offset="50%" stopColor="rgb(var(--accent-pink-rgb))" />
          <stop offset="100%" stopColor="rgb(var(--accent-blue-rgb))" />
        </linearGradient>
      </defs>
      <path
        d="M 20 33 C 36 33, 44 43, 60 43 S 80 37, 80 37"
        fill="none"
        stroke="url(#auroraLogo)"
        strokeWidth={6}
        strokeLinecap="round"
        opacity={0.95}
      />
      <path
        d="M 20 47 C 36 47, 44 57, 60 57 S 80 51, 80 51"
        fill="none"
        stroke="url(#auroraLogo)"
        strokeWidth={7}
        strokeLinecap="round"
        opacity={1}
      />
      <path
        d="M 20 61 C 36 61, 44 71, 60 71 S 80 65, 80 65"
        fill="none"
        stroke="url(#auroraLogo)"
        strokeWidth={6}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}
