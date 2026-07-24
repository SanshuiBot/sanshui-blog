export default function PostLoading() {
  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
      {/* 顶部旋转加载环 — SVG 原生 animateTransform */}
      <div className="flex items-center justify-center mb-10">
        <svg className="w-12 h-12" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
            className="text-black/[0.08] dark:text-white/[0.08]" />
          <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
            strokeLinecap="round"
            stroke="url(#post-spin-grad)"
            strokeDasharray="125.6"
            strokeDashoffset="31.4">
            <animateTransform attributeName="transform" type="rotate"
              from="-90 24 24" to="270 24 24"
              dur="0.8s" repeatCount="indefinite" />
          </circle>
          <defs>
            <linearGradient id="post-spin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ff6ec7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 加载文字 + 跳跃点 */}
      <div className="flex items-center justify-center gap-1 mb-10">
        <span className="text-sm font-medium text-black/40 dark:text-white/40">加载中</span>
        <span className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30"
              style={{
                animation: 'dot-bounce 0.8s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </span>
      </div>

      <div className="flex gap-10">
        <div className="flex-1 min-w-0 max-w-3xl">
          <Skel className="mb-8 h-4 w-20" />
          <div className="flex gap-2 mb-5">
            <Skel className="h-6 w-16 !rounded-full" />
            <Skel className="h-6 w-20 !rounded-full" />
            <Skel className="h-6 w-14 !rounded-full" />
          </div>
          <div className="mb-4 space-y-3">
            <Skel className="h-10 w-3/4 !rounded-lg" />
            <Skel className="h-10 w-1/2 !rounded-lg" />
          </div>
          <div className="flex items-center gap-4 mb-10">
            <Skel className="h-4 w-32" />
            <Skel className="h-4 w-28" />
          </div>
          <div className="h-px mb-10 bg-black/[0.06] dark:bg-white/[0.06]" />
          <div className="space-y-4">
            <Skel />
            <Skel className="w-11/12" />
            <Skel className="w-4/5" />
            <Skel />
            <Skel className="w-3/4" />
            <Skel />
            <Skel className="w-5/6" />
            <Skel />
            <Skel className="w-2/3" />
            <Skel />
            <Skel className="w-4/5" />
          </div>
        </div>
        <div className="hidden lg:block sticky top-28 w-56 shrink-0 self-start ml-8">
          <Skel className="h-3 w-12 mb-4" />
          <div className="space-y-2 border-l border-black/[0.06] dark:border-white/[0.06] pl-3">
            <Skel className="h-3 w-40" />
            <Skel className="h-3 w-36" />
            <Skel className="h-3 w-44" />
            <Skel className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 带流光扫过的骨架行 — 主题自适应 */
function Skel({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-black/[0.06] dark:bg-white/[0.06] ${className ?? 'h-4 w-full'}`}
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] dark:via-white/[0.06] to-transparent"
        style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
      />
    </div>
  );
}
