export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center animate-pulse">
      {/* Central loading indicator */}
      <div className="text-center space-y-4">
        {/* Logo / avatar placeholder */}
        <div className="mx-auto w-16 h-16 rounded-full bg-white/5" />
        <div className="mx-auto h-4 w-40 rounded bg-white/5" />
        <div className="mx-auto h-3 w-60 rounded bg-white/5" />
      </div>
    </div>
  );
}
