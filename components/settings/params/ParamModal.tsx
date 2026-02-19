"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Variable, Binary, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ParamType = 'constant' | 'variable';

interface ParamItem {
  id: string;
  nome: string;
  valor?: number; // Para constante
  valorPadrao?: number; // Para variavel
}

interface ParamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: ParamItem | null;
  type: ParamType;
  isLoading?: boolean;
}

export function ParamModal({ isOpen, onClose, onSave, initialData, type, isLoading }: ParamModalProps) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNome(initialData?.nome || "");
      // Determina qual campo de valor usar baseado no tipo
      const val = type === 'constant' ? initialData?.valor : initialData?.valorPadrao;
      setValor(val?.toString() || "");
    }
  }, [isOpen, initialData, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nome", nome);
    // Envia com a chave correta para a server action
    formData.append(type === 'constant' ? "valor" : "valorPadrao", valor);
    
    await onSave(formData);
  };

  const title = type === 'constant' ? "Constante" : "Variável";
  const labelValor = type === 'constant' ? "Valor Fixo" : "Valor Padrão";
  const Icon = type === 'constant' ? Binary : Variable;

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
              className="bg-white dark:bg-zinc-900 border border-border/10 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/10 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {initialData ? `Editar ${title}` : `Nova ${title}`}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-foreground/50 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder={`Ex: ${type === 'constant' ? 'PI' : 'LARGURA_PISTA'}`}
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <Binary className="w-4 h-4" />
                    {labelValor}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-mono"
                  />
                </div>

                <div className="pt-4 flex gap-3 justify-end">
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
                    {isLoading ? "Salvando..." : (initialData ? "Atualizar" : "Salvar")}
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
