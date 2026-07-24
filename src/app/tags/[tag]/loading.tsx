export default function TagPageLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-pulse">
      {/* 返回按钮占位 */}
      <div className="mb-8 h-4 w-20 rounded bg-white/5" />

      <div className="mb-12">
        <div className="h-4 w-12 rounded bg-white/5 mb-4" />
        <div className="h-10 w-48 rounded-lg bg-white/5 mb-3" />
        <div className="h-4 w-24 rounded bg-white/5" />
      </div>

      {/* PostCards 网格占位 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
            <div className="h-[2px] bg-white/5" />
            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex gap-1.5">
                <div className="h-5 w-12 rounded-full bg-white/5" />
                <div className="h-5 w-16 rounded-full bg-white/5" />
              </div>
              <div className="h-5 w-3/4 rounded bg-white/5" />
              <div className="h-5 w-1/2 rounded bg-white/5" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-4/5 rounded bg-white/5" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="h-3 w-24 rounded bg-white/5" />
                <div className="h-4 w-10 rounded bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
