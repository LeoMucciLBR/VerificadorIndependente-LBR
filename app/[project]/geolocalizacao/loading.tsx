export default function Loading() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-slate-900">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Carregando mapa...</p>
        </div>
      </div>
    </div>
  );
}
