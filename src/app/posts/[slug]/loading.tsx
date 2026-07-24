export default function PostLoading() {
  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
      <div className="flex gap-10">
        <div className="flex-1 min-w-0 max-w-3xl animate-pulse">
          {/* 返回按钮占位 */}
          <div className="mb-8 h-4 w-20 rounded bg-white/5" />

          {/* 标签占位 */}
          <div className="flex gap-2 mb-5">
            <div className="h-6 w-16 rounded-full bg-white/5" />
            <div className="h-6 w-20 rounded-full bg-white/5" />
            <div className="h-6 w-14 rounded-full bg-white/5" />
          </div>

          {/* 标题占位 */}
          <div className="mb-4 space-y-3">
            <div className="h-10 w-3/4 rounded-lg bg-white/5" />
            <div className="h-10 w-1/2 rounded-lg bg-white/5" />
          </div>

          {/* 日期与阅读时间占位 */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-4 w-32 rounded bg-white/5" />
            <div className="h-4 w-28 rounded bg-white/5" />
          </div>

          {/* 分隔线占位 */}
          <div className="h-px mb-10 bg-white/5" />

          {/* 内容段落占位 */}
          <div className="space-y-4">
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-11/12 rounded bg-white/5" />
            <div className="h-4 w-4/5 rounded bg-white/5" />
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-3/4 rounded bg-white/5" />
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-5/6 rounded bg-white/5" />
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-2/3 rounded bg-white/5" />
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-4/5 rounded bg-white/5" />
          </div>
        </div>

        {/* TOC 侧栏占位 — 仅在 lg 屏幕显示 */}
        <div className="hidden lg:block sticky top-28 w-56 shrink-0 self-start ml-8 animate-pulse">
          <div className="h-3 w-12 rounded bg-white/5 mb-4" />
          <div className="space-y-2 border-l border-white/5 pl-3">
            <div className="h-3 w-40 rounded bg-white/5" />
            <div className="h-3 w-36 rounded bg-white/5" />
            <div className="h-3 w-44 rounded bg-white/5" />
            <div className="h-3 w-32 rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
