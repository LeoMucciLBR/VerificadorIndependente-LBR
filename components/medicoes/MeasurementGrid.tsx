"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Check, AlertCircle, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertMedicao } from "@/app/actions/medicoes";
import { toast } from "sonner";

// Simple debounce hook implementation inline
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface GridItem {
  indicador: {
    id: string;
    nome: string;
    sigla: string;
    unidade: string;
    grupo: string;
  };
  medicao: {
    id?: string;
    valor: number;
    status: string;
    observacoes?: string | null;
  } | null;
}

interface MeasurementGridProps {
  data: GridItem[];
  competencia: Date;
  faseId: string;
}

export function MeasurementGrid({ data, competencia, faseId }: MeasurementGridProps) {
  // Group data
  const groups = data.reduce((acc, item) => {
    const group = item.indicador.grupo;
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, GridItem[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName} className="bg-white dark:bg-white/5 border border-border/10 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-foreground/5 px-6 py-4 border-b border-border/10 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{groupName}</h3>
            <span className="text-xs text-foreground/50">{items.length} indicadores</span>
          </div>
          <div className="divide-y divide-border/10">
            {items.map(item => (
              <MeasurementRow 
                key={item.indicador.id} 
                item={item} 
                competencia={competencia} 
                faseId={faseId} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MeasurementRow({ item, competencia, faseId }: { item: GridItem, competencia: Date, faseId: string }) {
  const [valor, setValor] = useState<string>(item.medicao?.valor?.toString() || "");
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Debounce saving
  const debouncedValor = useDebounceValue(valor, 1000);

  useEffect(() => {
    // Skip initial load or empty
    if (debouncedValor === (item.medicao?.valor?.toString() || "") && status === 'idle') return;
    if (debouncedValor === "") return; // Don't save empty string automatically? Or save as 0? Let's assume mandatory input for now.

    const save = async () => {
      setStatus('saving');
      const numValor = parseFloat(debouncedValor);
      if (isNaN(numValor)) {
        setStatus('error');
        return;
      }

      const result = await upsertMedicao({
        competencia,
        faseId,
        indicadorId: item.indicador.id,
        valor: numValor
      });

      if (result.success) {
        setStatus('saved');
        // Reset to idle after a while
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
        toast.error("Erro ao salvar valor");
      }
    };

    save();
  }, [debouncedValor, competencia, faseId, item.indicador.id]);

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-foreground/[0.02] transition-colors group">
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                {item.indicador.sigla}
            </span>
            <span className="text-xs text-foreground/40 font-medium">
                {item.indicador.unidade}
            </span>
        </div>
        <h4 className="text-sm font-medium text-foreground truncate" title={item.indicador.nome}>
            {item.indicador.nome}
        </h4>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
            <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={cn(
                    "w-32 bg-zinc-50 dark:bg-black/20 border rounded-lg px-3 py-2 text-right font-mono text-sm outline-none transition-all",
                    status === 'error' ? "border-red-500/50 focus:ring-red-500/50" : 
                    status === 'saved' ? "border-emerald-500/50 focus:ring-emerald-500/50" :
                    "border-border/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                )}
                placeholder="0.00"
            />
            <div className="absolute right-[-24px] top-1/2 -translate-y-1/2">
                {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-foreground/30" />}
                {status === 'saved' && <Check className="w-4 h-4 text-emerald-500" />}
                {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
        </div>
      </div>
    </div>
  );
}
