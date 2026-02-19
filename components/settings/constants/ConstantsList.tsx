"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Binary, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getConstants, createConstant, updateConstant, deleteConstant } from "@/app/actions/params";
import { toast } from "sonner";
import { SettingsPageLayout } from "../shared/SettingsPageLayout";

interface Constant {
  id: string;
  nome: string;
  valor: number;
}

export function ConstantsList() {
  const [constants, setConstants] = useState<Constant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Constant | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const result = await getConstants();
    if (result.success && result.data) {
      setConstants(result.data);
    } else {
      toast.error("Erro ao carregar constantes.");
    }
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Constant) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta constante?")) return;
    const result = await deleteConstant(id);
    if (result.success) {
      toast.success("Constante excluída com sucesso");
      loadData();
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  };

  return (
    <SettingsPageLayout
      title="Constantes do Sistema"
      description="Gerencie valores fixos utilizados nas fórmulas de cálculo."
      icon={Binary}
      onNew={handleCreate}
      newLabel="Nova Constante"
      stats={[
        { label: "Total cadastrado", value: constants.length }
      ]}
    >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p>Carregando constantes...</p>
          </div>
        ) : constants.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Binary className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma constante cadastrada.</p>
            <Button variant="link" onClick={handleCreate} className="text-emerald-600">Criar agora</Button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {constants.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl transition-all hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-400/50 to-emerald-500/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Binary className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{item.nome}</h3>
                                <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 tracking-wide uppercase">Constante Global</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                             <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <Pencil className="w-4 h-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="w-4 h-4" />
                             </Button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="rounded-xl bg-slate-50/80 dark:bg-black/20 p-4 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Binary className="w-16 h-16 -mr-4 -mt-4 text-emerald-500" />
                             </div>
                             <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Valor Definido</p>
                             <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{item.valor}</p>
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
    </SettingsPageLayout>
  );
}
