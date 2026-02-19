"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Mail, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Institution {
  id: string;
  nome: string;
  nomeResponsavel: string;
  emailResponsavel: string;
}

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: Institution | null;
  isLoading?: boolean;
}

export function InstitutionModal({ isOpen, onClose, onSave, initialData, isLoading }: InstitutionModalProps) {
  const [nome, setNome] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNome(initialData?.nome || "");
      setNomeResponsavel(initialData?.nomeResponsavel || "");
      setEmailResponsavel(initialData?.emailResponsavel || "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("nomeResponsavel", nomeResponsavel);
    formData.append("emailResponsavel", emailResponsavel);
    
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
              className="bg-white dark:bg-zinc-900 border border-border/10 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/10 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {initialData ? "Editar Instituição" : "Nova Instituição"}
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
                    <Building2 className="w-4 h-4" />
                    Nome da Entidade
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Secretaria de Transportes"
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Responsável
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    placeholder="Nome do contato principal"
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email do Responsável
                  </label>
                  <input
                    type="email"
                    required
                    value={emailResponsavel}
                    onChange={(e) => setEmailResponsavel(e.target.value)}
                    placeholder="contato@exemplo.gov.br"
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
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
                    {isLoading ? "Salvando..." : (initialData ? "Atualizar" : "Salvar Instituição")}
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
