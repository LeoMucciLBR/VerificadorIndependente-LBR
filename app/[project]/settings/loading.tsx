export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#020617]">
      <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
        </div>

        {/* Settings cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
