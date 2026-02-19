"use client";

import ExecutionList from "@/components/execucoes/ExecutionList";
import CreateExecutionModal from "@/components/execucoes/CreateExecutionModal";
import { ClipboardList, Activity, PlayCircle, Calendar } from "lucide-react";

type ExecucoesViewProps = {
  executions: any[];
  fases: any[];
  rodovias: any[];
};

export default function ExecucoesView({ executions, fases, rodovias }: ExecucoesViewProps) {
  // Encontrar execução ativa (não concluída, mais recente)
  const activeExecution = executions.find(e => e.status !== 'Concluido') || null;
  
  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short',
        year: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden transition-colors duration-300">
      {/* Background - Clean Technical Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.4] dark:opacity-[0.2] pointer-events-none" />
      
      {/* Top Gradient Glow */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative container mx-auto px-6 py-8 flex flex-col gap-8 h-full z-10">
        
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-primary/20 shadow-lg shadow-slate-200/50 dark:shadow-primary/5">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                Execuções de Inspeção
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-lg text-sm">
                Gerencie vistorias técnicas, acompanhe o progresso das fases e emita relatórios oficiais de conformidade.
              </p>
            </div>
          </div>

          {/* Stats & Actions Area */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Total */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <Activity className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <div className="flex flex-col leading-none gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Total</span>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{executions.length}</span>
              </div>
            </div>
            
            {/* Execução Ativa */}
            {activeExecution && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30">
                <div className="relative">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col leading-none gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Execução Ativa</span>
                  <span className="text-sm font-bold text-primary">{activeExecution.fase?.nome || "Inspeção"}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                  <Calendar className="w-3 h-3" />
                  {formatDate(activeExecution.dataInicioVistoria)}
                </div>
              </div>
            )}
            
            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block" />
            
            <CreateExecutionModal fases={fases} rodovias={rodovias} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
          <ExecutionList executions={executions} activeExecutionId={activeExecution ? String(activeExecution.id) : undefined} />
        </div>

      </div>
    </div>
  );
}
