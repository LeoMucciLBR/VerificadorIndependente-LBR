export default function Loading() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-14 h-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Carregando projetos...</p>
      </div>
    </div>
  );
}
