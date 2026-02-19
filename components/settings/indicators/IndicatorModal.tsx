"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Tag, FileText, Ruler, Briefcase, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaAtuacao, AREA_ATUACAO_LABELS } from "@/types/enums";

interface Indicator {
  id: string;
  nome: string;
  descricao: string;
  sigla: string;
  unidadeMedida: string;
  areaAtuacao: AreaAtuacao;
  grupoId?: string;
  grupo_id?: string; // Alias from database
}

interface GroupOption {
  id: string;
  nome: string;
  sigla: string;
}

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: Indicator | null;
  groups: GroupOption[];
  isLoading?: boolean;
}

// Convert enum to array for select options
const areaOptions = Object.values(AreaAtuacao);

export function IndicatorModal({ isOpen, onClose, onSave, initialData, groups, isLoading }: IndicatorModalProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [sigla, setSigla] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState<string>(areaOptions[0]);
  const [grupoId, setGrupoId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNome(initialData?.nome || "");
      setDescricao(initialData?.descricao || "");
      setSigla(initialData?.sigla || "");
      setUnidadeMedida(initialData?.unidadeMedida || "");
      setAreaAtuacao(initialData?.areaAtuacao || areaOptions[0]);
      setGrupoId(initialData?.grupoId || initialData?.grupo_id || "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("descricao", descricao);
    formData.append("sigla", sigla);
    formData.append("unidadeMedida", unidadeMedida);
    formData.append("areaAtuacao", areaAtuacao);
    formData.append("grupoId", grupoId);
    
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
              className="bg-white dark:bg-zinc-900 border border-border/10 dark:border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/10 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 shrink-0">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {initialData ? "Editar Indicador" : "Novo Indicador"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-foreground/50 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                
                {/* Linha 1: Nome e Sigla */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Nome do Indicador
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Índice de Irregularidade Longitudinal"
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Sigla
                    </label>
                    <input
                      type="text"
                      required
                      value={sigla}
                      onChange={(e) => setSigla(e.target.value)}
                      placeholder="IRI"
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>
                </div>

                {/* Linha 2: Descrição */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Descrição Detalhada
                    </label>
                    <textarea
                      required
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva o que este indicador mede e como deve ser interpretado..."
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 min-h-[100px] outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none"
                    />
                </div>

                {/* Linha 3: Unidade, Área e Grupo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Unidade de Medida
                    </label>
                    <input
                      type="text"
                      required
                      value={unidadeMedida}
                      onChange={(e) => setUnidadeMedida(e.target.value)}
                      placeholder="Ex: m/km, %, un"
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Área de Atuação
                    </label>
                    <select
                      value={areaAtuacao}
                      onChange={(e) => setAreaAtuacao(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                    >
                      {areaOptions.map((area) => (
                        <option key={area} value={area}>
                          {AREA_ATUACAO_LABELS[area as AreaAtuacao]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      Grupo
                    </label>
                    <select
                      required
                      value={grupoId}
                      onChange={(e) => setGrupoId(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="">Selecione um grupo</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.nome} ({group.sigla})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-border/10 dark:border-white/5 mt-6">
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
                    {isLoading ? "Salvando..." : (initialData ? "Atualizar" : "Salvar Indicador")}
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
