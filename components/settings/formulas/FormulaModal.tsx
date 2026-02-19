"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Settings2, Sigma, Target, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormulaEditor } from "./FormulaEditor";
import { cn } from "@/lib/utils";

interface Formula {
  id: string;
  nome: string;
  descricao: string;
  expressao: string;
  grupoId: string;
  isPrincipal: boolean;
  exigeGeolocalizacao: boolean;
  exigePeriodo: boolean;
  fases: { faseId: string }[];
}

interface Option {
  id: string;
  nome: string;
  sigla?: string;
  valor?: number;
  valorPadrao?: number;
}

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: Formula | null;
  groups: Option[];
  phases: Option[];
  indicators: Option[];
  constants: Option[];
  variables: Option[];
  isLoading?: boolean;
}

export function FormulaModal({ 
  isOpen, onClose, onSave, initialData, 
  groups, phases, indicators, constants, variables, 
  isLoading 
}: FormulaModalProps) {
  
  const [activeTab, setActiveTab] = useState<'general' | 'builder'>('general');
  
  // General Data
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [selectedPhases, setSelectedPhases] = useState<Set<string>>(new Set());
  
  // Flags
  const [isPrincipal, setIsPrincipal] = useState(false);
  const [exigeGeolocalizacao, setExigeGeolocalizacao] = useState(false);
  const [exigePeriodo, setExigePeriodo] = useState(false);

  // Expression
  const [expressao, setExpressao] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNome(initialData?.nome || "");
      setDescricao(initialData?.descricao || "");
      setGrupoId(initialData?.grupoId || "");
      setExpressao(initialData?.expressao || "");
      setIsPrincipal(initialData?.isPrincipal || false);
      setExigeGeolocalizacao(initialData?.exigeGeolocalizacao || false);
      setExigePeriodo(initialData?.exigePeriodo || false);
      
      const phasesSet = new Set<string>();
      if (initialData?.fases) {
        initialData.fases.forEach(f => phasesSet.add(f.faseId));
      }
      setSelectedPhases(phasesSet);
      
      setActiveTab('general');
    }
  }, [isOpen, initialData]);

  const togglePhase = (id: string) => {
    const newSet = new Set(selectedPhases);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPhases(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("descricao", descricao);
    formData.append("expressao", expressao);
    formData.append("grupoId", grupoId);
    formData.append("isPrincipal", String(isPrincipal));
    formData.append("exigeGeolocalizacao", String(exigeGeolocalizacao));
    formData.append("exigePeriodo", String(exigePeriodo));
    
    selectedPhases.forEach(id => formData.append("faseIds", id));
    
    await onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-border/10 dark:border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/10 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 shrink-0">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Sigma className="w-5 h-5 text-primary" />
                  {initialData ? "Editar Fórmula" : "Nova Fórmula"}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-foreground/50 hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

               {/* Tabs - Header */}
               <div className="flex border-b border-border/10 px-6">
                 <button
                   onClick={() => setActiveTab('general')}
                   className={cn(
                     "px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                     activeTab === 'general' 
                       ? "border-primary text-primary" 
                       : "border-transparent text-foreground/60 hover:text-foreground"
                   )}
                 >
                   <Settings2 className="w-4 h-4" />
                   Configurações Gerais
                 </button>
                 <button
                   onClick={() => setActiveTab('builder')}
                   className={cn(
                     "px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                     activeTab === 'builder' 
                       ? "border-primary text-primary" 
                       : "border-transparent text-foreground/60 hover:text-foreground"
                   )}
                 >
                   <Calculator className="w-4 h-4" />
                   Construtor de Fórmula
                 </button>
               </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {activeTab === 'general' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/70">Nome da Fórmula</label>
                                    <input
                                        type="text"
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                                        placeholder="Ex: Índice de Execução Global"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/70">Grupo de Classificação</label>
                                    <select
                                        required
                                        value={grupoId}
                                        onChange={(e) => setGrupoId(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                                    >
                                        <option value="">Selecione um grupo</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.nome} ({g.sigla})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/70">Descrição Metodológica</label>
                                    <textarea
                                        required
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        className="w-full h-32 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none"
                                        placeholder="Explique como essa fórmula é calculada..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-foreground/70">Configurações Avançadas</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-3 rounded-lg border border-border/10 bg-zinc-50/50 dark:bg-white/5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                                            <input type="checkbox" checked={isPrincipal} onChange={e => setIsPrincipal(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                            <div>
                                                <span className="block text-sm font-medium text-foreground">Indicador Principal (KPI Master)</span>
                                                <span className="block text-xs text-foreground/50">Define se esta fórmula representa o desempenho global.</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 rounded-lg border border-border/10 bg-zinc-50/50 dark:bg-white/5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                                            <input type="checkbox" checked={exigeGeolocalizacao} onChange={e => setExigeGeolocalizacao(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                            <span className="text-sm font-medium text-foreground">Exige Geolocalização no Cálculo</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        Aplicabilidade por Fase
                                    </label>
                                    <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => {
                                        if (selectedPhases.size === phases.length) setSelectedPhases(new Set());
                                        else setSelectedPhases(new Set(phases.map(p => p.id)));
                                    }}>
                                        {selectedPhases.size === phases.length ? "Desmarcar Todas" : "Todas"}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[400px]">
                                    {phases.map(fase => (
                                        <div 
                                            key={fase.id}
                                            onClick={() => togglePhase(fase.id)}
                                            className={cn(
                                                "p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
                                                selectedPhases.has(fase.id) 
                                                    ? "bg-primary/5 border-primary/50" 
                                                    : "bg-transparent border-border/10 hover:border-foreground/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                selectedPhases.has(fase.id) ? "bg-primary border-primary text-white" : "border-foreground/30"
                                            )}>
                                                {selectedPhases.has(fase.id) && <motion.div initial={{scale:0}} animate={{scale:1}} className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <span className="text-sm text-foreground">{fase.nome}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <FormulaEditor 
                                value={expressao} 
                                onChange={setExpressao}
                                indicators={indicators}
                                constants={constants}
                                variables={variables}
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border/10 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 shrink-0 flex justify-between items-center">
                   <div className="text-xs text-foreground/50">
                        {activeTab === 'general' ? "Preencha os metadados antes da fórmula." : "Utilize os tokens laterais para construir a expressão."}
                   </div>
                   <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost" 
                            onClick={onClose}
                            className="hover:bg-zinc-100 dark:hover:bg-white/5 text-foreground/70"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                        >
                            {isLoading ? "Salvando..." : (initialData ? "Atualizar Fórmula" : "Salvar Fórmula")}
                        </Button>
                   </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
