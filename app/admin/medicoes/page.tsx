"use client";

import { useState, useEffect } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeasurementGrid } from "@/components/medicoes/MeasurementGrid";
import { getMedicoesInputGrid } from "@/app/actions/medicoes";
import { getPhases } from "@/app/actions/phases";
import { toast } from "sonner";

export default function MedicoesPage() {
  const [date, setDate] = useState<Date>(new Date()); // Today, but effectively just Month/Year matters
  const [phases, setPhases] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [gridData, setGridData] = useState<any[]>([]);
  const [isGridLoaded, setIsGridLoaded] = useState(false);

  useEffect(() => {
    // Load phases on mount
    getPhases().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setPhases(res.data);
        setSelectedPhase(res.data[0].id.toString()); // Convert BigInt to string
      }
    });
  }, []);

  // Fetch grid when phase or date changes (could be manual button too)
  useEffect(() => {
    if (!selectedPhase) return;
    
    // Normalize date to 1st of month
    const competencia = new Date(date.getFullYear(), date.getMonth(), 1);
    
    setIsLoading(true);
    getMedicoesInputGrid(competencia, selectedPhase)
      .then(res => {
        if (res.success && res.data) {
          setGridData(res.data);
          setIsGridLoaded(true);
        } else {
          toast.error("Erro ao carregar dados.");
        }
      })
      .finally(() => setIsLoading(false));

  }, [date, selectedPhase]);

  const changeMonth = (delta: number) => {
    setDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-white/5 p-6 rounded-2xl border border-border/10 shadow-sm">
         
         {/* Month Selector */}
         <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex flex-col items-center min-w-[140px]">
               <span className="text-sm text-foreground/50 font-medium uppercase tracking-wider">Competência</span>
               <span className="text-xl font-bold text-foreground flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-primary" />
                 {format(date, "MMMM/yyyy", { locale: ptBR })}
               </span>
            </div>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
         </div>

         {/* Phase Selector */}
         <div className="flex-1 w-full md:w-auto">
             <div className="flex items-center gap-3 bg-zinc-50 dark:bg-black/20 p-2 rounded-lg border border-border/10">
                <div className="p-2 bg-white dark:bg-white/5 rounded shadow-sm">
                    <Filter className="w-5 h-5 text-foreground/50" />
                </div>
                <select 
                    value={selectedPhase} 
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="bg-transparent w-full text-foreground font-medium outline-none"
                    disabled={phases.length === 0}
                >
                    {phases.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                    {phases.length === 0 && <option>Carregando fases...</option>}
                </select>
             </div>
         </div>
         
         {/* Status / Summary (Placeholder) */}
         <div className="hidden md:flex flex-col items-end">
             <span className="text-xs text-foreground/40">Status da Competência</span>
             <span className="text-sm font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">ABERTO PARA LANÇAMENTO</span>
         </div>
      </div>

      {/* Grid Content */}
      <div className="min-h-[500px]">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-4 text-foreground/50">
                 <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                 <p className="animate-pulse">Sincronizando planilha de medição...</p>
             </div>
          ) : isGridLoaded && gridData.length > 0 ? (
             <MeasurementGrid 
                data={gridData} 
                competencia={new Date(date.getFullYear(), date.getMonth(), 1)}
                faseId={selectedPhase}
             />
          ) : (
             <div className="flex flex-col items-center justify-center h-64 gap-4 text-foreground/50 bg-white dark:bg-white/5 rounded-2xl border border-border/10">
                 <p>Nenhum indicador encontrado para esta fase.</p>
             </div>
          )}
      </div>
    </div>
  );
}
