export default function AboutLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-pulse">
      {/* 返回按钮占位 */}
      <div className="mb-8 h-4 w-20 rounded bg-white/5" />

      <div className="mb-10">
        <div className="h-4 w-12 rounded bg-white/5 mb-4" />
        <div className="h-10 w-72 rounded-lg bg-white/5" />
      </div>

      {/* 正文占位 */}
      <div className="space-y-3 mb-16">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-4/5 rounded bg-white/5" />
        <div className="h-4 w-3/4 rounded bg-white/5" />
      </div>

      {/* Skills 占位 */}
      <div className="mb-16">
        <div className="h-6 w-16 rounded bg-white/5 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <div className="h-4 w-20 rounded bg-white/5" />
                <div className="h-4 w-10 rounded bg-white/5" />
              </div>
              <div className="h-1.5 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      </div>

      {/* 技术栈卡片占位 */}
      <div className="mb-16">
        <div className="h-6 w-16 rounded bg-white/5 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-white/5" />
                  <div className="h-4 w-12 rounded bg-white/5" />
                </div>
                <div className="h-4 w-10 rounded-full bg-white/5" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-8 w-24 rounded-lg bg-white/5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 联系卡片占位 */}
      <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/5">
        <div className="h-6 w-24 rounded bg-white/5 mb-3" />
        <div className="h-4 w-64 rounded bg-white/5 mb-6" />
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-xl bg-white/5" />
          <div className="h-10 w-28 rounded-xl bg-white/5" />
          <div className="h-10 w-28 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
