"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Tag, Hash, Network, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Group {
  id: string;
  nome: string;
  sigla: string;
  peso: number;
  grupoPaiId?: string | null;
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: Group | null;
  availableParents: Group[];
  isLoading?: boolean;
}

export function GroupModal({ isOpen, onClose, onSave, initialData, availableParents, isLoading }: GroupModalProps) {
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [peso, setPeso] = useState("1");
  const [grupoPaiId, setGrupoPaiId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNome(initialData?.nome || "");
      setSigla(initialData?.sigla || "");
      setPeso(initialData?.peso?.toString() || "1");
      setGrupoPaiId(initialData?.grupoPaiId || "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("sigla", sigla);
    formData.append("peso", peso);
    if (grupoPaiId) formData.append("grupoPaiId", grupoPaiId);
    
    await onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {initialData ? "Editar Grupo" : "Novo Grupo"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {initialData ? "Atualize os dados da equipe" : "Defina um novo grupo de trabalho"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Nome do Grupo
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Infraestrutura Rodoviária"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Sigla
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={sigla}
                      onChange={(e) => setSigla(e.target.value)}
                      placeholder="INFRA"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Peso
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Grupo Pai
                </label>
                <div className="relative">
                  <Network className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={grupoPaiId}
                    onChange={(e) => setGrupoPaiId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">Nenhum (Grupo Raiz)</option>
                    {availableParents.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.nome} ({group.sigla})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="px-6 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/20"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">Salvando...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {initialData ? "Salvar Alterações" : "Criar Grupo"}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
