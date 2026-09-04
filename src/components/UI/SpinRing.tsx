/**
 * 旋转加载环（文章加载页 / 导航覆盖层共用）
 * -----------------------------
 * 纯 CSS animation 旋转（globals.css 的 @keyframes spin，约定 #32）。
 * gradId 由调用方传入以保证页面内唯一，多实例并存时 SVG 渐变引用不串扰。
 */
export default function SpinRing({ sizeClass, gradId }: { sizeClass: string; gradId: string }) {
  return (
    <svg
      className={sizeClass}
      viewBox="0 0 48 48"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      {/* 底层环 */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-black/[0.08] dark:text-fg/[0.08]"
      />
      {/* 上层旋转弧 */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        stroke={`url(#${gradId})`}
        strokeDasharray="125.6"
        strokeDashoffset="31.4"
      />
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="stop-accent-violet" />
          <stop offset="50%" className="stop-accent-pink" />
          <stop offset="100%" className="stop-accent-blue" />
        </linearGradient>
      </defs>
    </svg>
  );
}
