export default function LinksLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-pulse">
      {/* 返回按钮占位 */}
      <div className="mb-8 h-4 w-20 rounded bg-white/5" />

      <div className="mb-12">
        <div className="h-4 w-12 rounded bg-white/5 mb-4" />
        <div className="h-10 w-48 rounded-lg bg-white/5 mb-3" />
        <div className="h-4 w-28 rounded bg-white/5" />
      </div>

      {/* 友链卡片占位 */}
      <div className="flex items-center gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
        <div className="w-14 h-14 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-24 rounded bg-white/5" />
          <div className="h-4 w-36 rounded bg-white/5" />
        </div>
      </div>

      {/* 交换友链卡片占位 */}
      <div className="mt-12 p-8 rounded-3xl bg-white/[0.03] border border-white/5">
        <div className="h-6 w-40 rounded bg-white/5 mb-3" />
        <div className="h-4 w-64 rounded bg-white/5 mb-5" />
        <div className="flex gap-3">
          <div className="h-11 w-28 rounded-xl bg-white/5" />
          <div className="h-11 w-28 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
