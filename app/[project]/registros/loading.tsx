export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#020617]">
      <div className="container mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
