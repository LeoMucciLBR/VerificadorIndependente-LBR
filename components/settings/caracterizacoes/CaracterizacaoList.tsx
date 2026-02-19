"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ListFilter, Target, Layers, Scale, FileText, ChevronDown, ChevronRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaracterizacaoModal } from "./CaracterizacaoModal";
import { getCaracterizacoes, createCaracterizacao, updateCaracterizacao, deleteCaracterizacao } from "@/app/actions/caracterizacoes";
import { getIndicators } from "@/app/actions/indicators";
import { getPhases } from "@/app/actions/phases";
import { toast } from "sonner";
import { TipoRetorno, TIPO_RETORNO_LABELS } from "@/types/enums";
import { cn } from "@/lib/utils";
import { SettingsPageLayout } from "../shared/SettingsPageLayout";

interface Caracterizacao {
  id: string;
  indicadorId: string;
  descricao: string;
  regulamentacao: string;
  tipoRetorno: TipoRetorno;
  indicador: { nome: string; sigla: string };
  fases: { faseId: string; fase: { nome: string } }[];
}

interface Option {
  id: string;
  nome: string;
  sigla?: string;
}

export function CaracterizacaoList() {
  const [caracterizacoes, setCaracterizacoes] = useState<Caracterizacao[]>([]);
  const [indicadores, setIndicadores] = useState<Option[]>([]);
  const [fases, setFases] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Caracterizacao | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [charResult, indResult, faseResult] = await Promise.all([
        getCaracterizacoes(),
        getIndicators(),
        getPhases()
      ]);

      if (charResult.success && charResult.data) {
        setCaracterizacoes(charResult.data as Caracterizacao[]);
      }
      
      if (indResult.success && indResult.data) {
        setIndicadores(indResult.data.map((i: any) => ({ 
            id: i.id, nome: i.nome, sigla: i.sigla 
        })));
      }

      if (faseResult.success && faseResult.data) {
        setFases(faseResult.data.map((f: any) => ({ 
            id: f.id, nome: f.nome 
        })));
      }
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    }
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Caracterizacao) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta caracterização?")) return;
    const result = await deleteCaracterizacao(id);
    if (result.success) {
      toast.success("Caracterização excluída com sucesso");
      loadData();
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    if (editingItem) {
      result = await updateCaracterizacao(editingItem.id, formData);
    } else {
      result = await createCaracterizacao(formData);
    }

    if (result.success) {
      toast.success(editingItem ? "Atualizado com sucesso!" : "Criado com sucesso!");
      setIsModalOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Erro ao salvar");
    }
    setIsSaving(false);
  };

  const toggleExpand = (indicadorId: string) => {
    const newSet = new Set(expandedIndicators);
    if (newSet.has(indicadorId)) {
      newSet.delete(indicadorId);
    } else {
      newSet.add(indicadorId);
    }
    setExpandedIndicators(newSet);
  };

  // Group by Indicator
  const groupedData = caracterizacoes.reduce((acc, curr) => {
    const indId = curr.indicadorId;
    if (!acc[indId]) {
      acc[indId] = {
        indicator: curr.indicador,
        items: []
      };
    }
    acc[indId].items.push(curr);
    return acc;
  }, {} as Record<string, { indicator: { nome: string; sigla: string }, items: Caracterizacao[] }>);

  return (
    <>
      <SettingsPageLayout
        title="Caracterização Técnica"
        description="Detalhamento técnico dos indicadores e aplicabilidade por fases."
        icon={ListFilter}
        onNew={handleCreate}
        newLabel="Nova Caracterização"
        stats={[
           { label: "Caracterizações", value: caracterizacoes.length },
           { label: "Indicadores Cobertos", value: Object.keys(groupedData).length, trend: "Abrangência", trendUp: true }
        ]}
      >
        <div className="w-full space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Carregando dados...</p>
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 bg-white/50 dark:bg-transparent">
              <ListFilter className="w-12 h-12 opacity-20" />
              <p>Nenhuma caracterização cadastrada.</p>
              <Button variant="link" onClick={handleCreate} className="text-purple-600">Criar primeira caracterização</Button>
            </div>
          ) : (
            <div className="bg-white/50 dark:bg-transparent">
               {Object.entries(groupedData).map(([indId, group]) => {
                const isExpanded = expandedIndicators.has(indId);
                return (
                  <div key={indId} className="border-b border-slate-100 dark:border-white/5 last:border-0">
                    <div 
                      onClick={() => toggleExpand(indId)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-1.5 rounded-md transition-colors", isExpanded ? "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-500" : "text-slate-400 dark:text-slate-500")}>
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                {group.indicator.nome}
                                <span className="font-mono text-xs bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">{group.indicator.sigla}</span>
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{group.items.length} caracterizações cadastradas</p>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-slate-50/50 dark:bg-black/20"
                        >
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.items.map(item => (
                              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm relative group/card hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors">
                                 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white dark:bg-slate-900 p-1 rounded-md shadow-sm border border-slate-100 dark:border-white/5 z-10">
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item)}} className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/10">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(item.id)}} className="h-7 w-7 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                 </div>

                                 <div className="space-y-3">
                                    <div className="flex items-start justify-between pr-16">
                                        <div className="flex items-center gap-2">
                                             <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                                {TIPO_RETORNO_LABELS[item.tipoRetorno]}
                                             </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <FileText className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                                            <span>{item.descricao}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-xs text-slate-500 italic bg-slate-50 dark:bg-white/5 p-2 rounded-md border border-slate-100 dark:border-white/5">
                                            <Scale className="w-3 h-3 mt-0.5 text-slate-400 shrink-0" />
                                            <span>{item.regulamentacao}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-dashed border-slate-200 dark:border-white/10">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Layers className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fases Aplicáveis ({item.fases.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.fases.map(f => (
                                                <span key={f.faseId} className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5">
                                                    {f.fase.nome}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                 </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SettingsPageLayout>

      <CaracterizacaoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
        indicadores={indicadores}
        fases={fases}
        isLoading={isSaving}
      />
    </>
  );
}
