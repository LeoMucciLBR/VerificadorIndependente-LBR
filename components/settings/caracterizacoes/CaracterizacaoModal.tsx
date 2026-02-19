"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Scale, CheckCircle2, Circle, ListFilter, Target, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TipoRetorno, TIPO_RETORNO_LABELS } from "@/types/enums";
import { cn } from "@/lib/utils";

interface Caracterizacao {
  id: string;
  indicadorId: string;
  descricao: string;
  regulamentacao: string;
  tipoRetorno: TipoRetorno;
  fases: { faseId: string }[];
}

interface Option {
  id: string;
  nome: string;
  sigla?: string;
}

interface CaracterizacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: Caracterizacao | null;
  indicadores: Option[];
  fases: Option[];
  isLoading?: boolean;
}

const tipoRetornoOptions = Object.values(TipoRetorno);

export function CaracterizacaoModal({ isOpen, onClose, onSave, initialData, indicadores, fases, isLoading }: CaracterizacaoModalProps) {
  const [indicadorId, setIndicadorId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [regulamentacao, setRegulamentacao] = useState("");
  const [tipoRetorno, setTipoRetorno] = useState<string>(tipoRetornoOptions[0]);
  const [selectedFases, setSelectedFases] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setIndicadorId(initialData?.indicadorId || "");
      setDescricao(initialData?.descricao || "");
      setRegulamentacao(initialData?.regulamentacao || "");
      setTipoRetorno(initialData?.tipoRetorno || tipoRetornoOptions[0]);
      
      const fasesSet = new Set<string>();
      if (initialData?.fases) {
        initialData.fases.forEach(f => fasesSet.add(f.faseId));
      } else {
        // Por padrão, talvez selecionar todas as fases ativas?
        // Vamos deixar limpo por enquanto para ser intencional
      }
      setSelectedFases(fasesSet);
    }
  }, [isOpen, initialData]);

  const toggleFase = (id: string) => {
    const newSet = new Set(selectedFases);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFases(newSet);
  };

  const toggleAllFases = () => {
    if (selectedFases.size === fases.length) {
      setSelectedFases(new Set());
    } else {
      setSelectedFases(new Set(fases.map(f => f.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("indicadorId", indicadorId);
    formData.append("descricao", descricao);
    formData.append("regulamentacao", regulamentacao);
    formData.append("tipoRetorno", tipoRetorno);
    
    selectedFases.forEach(id => {
      formData.append("faseIds", id);
    });
    
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
              className="bg-white dark:bg-zinc-900 border border-border/10 dark:border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/10 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 shrink-0">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-primary" />
                  {initialData ? "Editar Caracterização" : "Nova Caracterização"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-foreground/50 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Coluna Esquerda: Dados Básicos */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-4 border-b border-border/10 pb-2">
                        Dados Básicos
                    </h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Indicador Vinculado
                      </label>
                      <select
                        required
                        value={indicadorId}
                        onChange={(e) => setIndicadorId(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                      >
                        <option value="">Selecione um indicador</option>
                        {indicadores.map((ind) => (
                          <option key={ind.id} value={ind.id}>
                            {ind.nome} ({ind.sigla})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                        <ListFilter className="w-4 h-4" />
                        Tipo de Retorno
                      </label>
                      <select
                        value={tipoRetorno}
                        onChange={(e) => setTipoRetorno(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                      >
                        {tipoRetornoOptions.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {TIPO_RETORNO_LABELS[tipo as TipoRetorno]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Descrição Técnica
                        </label>
                        <textarea
                          required
                          value={descricao}
                          onChange={(e) => setDescricao(e.target.value)}
                          placeholder="Informe a descrição"
                          className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 h-[80px] outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          Regulamentação
                        </label>
                        <textarea
                          required
                          value={regulamentacao}
                          onChange={(e) => setRegulamentacao(e.target.value)}
                          placeholder="Base normativa ou contratual"
                          className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 h-[80px] outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none"
                        />
                    </div>
                  </div>

                  {/* Coluna Direita: Fases */}
                  <div className="space-y-5 h-full flex flex-col">
                    <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-2">
                        <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Aplicabilidade por Fase
                        </h3>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs text-primary hover:bg-primary/10"
                            onClick={toggleAllFases}
                        >
                            {selectedFases.size === fases.length ? "Desmarcar Todas" : "Selecionar Todas"}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {fases.length === 0 && (
                            <div className="col-span-full py-8 text-center text-foreground/40 text-sm">
                                Nenhuma fase cadastrada.
                            </div>
                        )}
                        {fases.map(fase => {
                            const isSelected = selectedFases.has(fase.id);
                            return (
                                <motion.div
                                    key={fase.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleFase(fase.id)}
                                    className={cn(
                                        "cursor-pointer rounded-lg p-3 border transition-all flex items-start gap-3",
                                        isSelected 
                                            ? "bg-primary/5 border-primary/50 shadow-sm" 
                                            : "bg-zinc-50 dark:bg-white/5 border-transparent hover:border-foreground/10"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
                                        isSelected ? "bg-primary border-primary text-white" : "border-foreground/20 bg-white dark:bg-white/5"
                                    )}>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-sm font-medium transition-colors",
                                            isSelected ? "text-primary" : "text-foreground"
                                        )}>
                                            {fase.nome}
                                        </span>
                                        {/* Poderia mostrar datas aqui se available */}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-auto pt-4 text-xs text-foreground/40 text-center">
                        Selecione as fases em que este indicador deve ser medido conforme esta caracterização.
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-border/10 dark:border-white/5">
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
                    {isLoading ? "Salvando..." : (initialData ? "Atualizar" : "Salvar Caracterização")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
