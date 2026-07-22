export default function Loading() {
  return (
    <div role="status" aria-label="加载中" className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-t-accent-violet border-r-accent-pink animate-spin" style={{ animationDuration: "0.8s" }} />
        </div>
        <span className="text-sm text-gray-600 animate-pulse">加载中...</span>
      </div>
    </div>
  );
}
