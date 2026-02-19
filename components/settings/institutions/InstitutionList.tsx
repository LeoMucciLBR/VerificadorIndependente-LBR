"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Building2, User, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstitutionModal } from "./InstitutionModal";
import { getInstitutions, createInstitution, updateInstitution, deleteInstitution } from "@/app/actions/institutions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SettingsPageLayout } from "../shared/SettingsPageLayout";

interface Institution {
  id: string;
  nome: string;
  nomeResponsavel: string;
  emailResponsavel: string;
  _count?: {
    users: number;
  };
}

export function InstitutionList() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Institution | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getInstitutions();
      if (result.success && result.data) {
        setInstitutions(result.data as Institution[]);
      }
    } catch (error) {
      toast.error("Erro ao carregar instituições.");
    }
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Institution) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instituição?")) return;
    const result = await deleteInstitution(id);
    if (result.success) {
      toast.success("Instituição excluída com sucesso");
      loadData();
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    if (editingItem) {
      result = await updateInstitution(editingItem.id, formData);
    } else {
      result = await createInstitution(formData);
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

  return (
    <SettingsPageLayout
      title="Instituições"
      description="Gerencie as organizações parceiras e seus responsáveis."
      icon={Building2}
      onNew={handleCreate}
      newLabel="Nova Instituição"
      stats={[
        { label: "Total", value: institutions.length },
        { label: "Usuários Vinculados", value: institutions.reduce((acc, curr) => acc + (curr._count?.users || 0), 0), trend: "Ativos", trendUp: true }
      ]}
    >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p>Carregando instituições...</p>
          </div>
        ) : institutions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma instituição cadastrada.</p>
            <Button variant="link" onClick={handleCreate} className="text-orange-600">Cadastrar primeira</Button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {institutions.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl transition-all hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1"
                >
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
                  
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 bg-white/80 dark:bg-black/50 backdrop-blur text-slate-500 hover:text-orange-600 shadow-sm rounded-full">
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 bg-white/80 dark:bg-black/50 backdrop-blur text-slate-500 hover:text-red-600 shadow-sm rounded-full">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-6 relative z-10">
                      <div className="flex flex-col gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
                              <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center">
                                  <Building2 className="w-8 h-8 text-orange-500" />
                              </div>
                          </div>
                          
                          <div>
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1 line-clamp-1" title={item.nome}>
                                {item.nome}
                            </h3>
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                    {item._count?.users || 0} usuários ativos
                                </span>
                            </div>
                          </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 space-y-3">
                          <div className="group/item flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <div className="p-1.5 rounded-full bg-slate-100 dark:bg-white/5 group-hover/item:bg-orange-50 dark:group-hover/item:bg-orange-500/20 transition-colors">
                                <User className="w-4 h-4 text-slate-400 group-hover/item:text-orange-500 transition-colors" />
                              </div>
                              <span className="truncate font-medium">{item.nomeResponsavel}</span>
                          </div>
                          <div className="group/item flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <div className="p-1.5 rounded-full bg-slate-100 dark:bg-white/5 group-hover/item:bg-orange-50 dark:group-hover/item:bg-orange-500/20 transition-colors">
                                <Mail className="w-4 h-4 text-slate-400 group-hover/item:text-orange-500 transition-colors" />
                              </div>
                              <span className="truncate">{item.emailResponsavel}</span>
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
