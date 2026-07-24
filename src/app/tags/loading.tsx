export default function TagsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-pulse">
      {/* 返回按钮占位 */}
      <div className="mb-8 h-4 w-20 rounded bg-white/5" />

      <div className="mb-12">
        <div className="h-4 w-12 rounded bg-white/5 mb-4" />
        <div className="h-10 w-48 rounded-lg bg-white/5 mb-3" />
        <div className="h-4 w-28 rounded bg-white/5" />
      </div>

      {/* 标签列表占位 */}
      <div className="flex flex-wrap gap-4 justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/5"
          >
            <div className="h-3 w-3 rounded bg-white/5" />
            <div className="h-4 w-16 rounded bg-white/5" />
            <div className="h-3 w-8 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
