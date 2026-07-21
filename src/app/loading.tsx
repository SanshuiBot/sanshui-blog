/**
 * Instant loading state shown by Next.js while a route segment is loading.
 * Renders a subtle centered spinner so navigation never shows a blank frame.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="加载中"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <span className="sr-only">正在加载…</span>
      <span
        aria-hidden="true"
        className="inline-block h-8 w-8 rounded-full border-2 border-stone-300 border-t-red-600 dark:border-stone-700 dark:border-t-red-400 animate-spin"
      />
    </div>
  );
}
