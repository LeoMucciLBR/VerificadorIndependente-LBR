"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Sigma, Calculator, FileWarning, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormulaModal } from "./FormulaModal";
import { getFormulas, createFormula, updateFormula, deleteFormula } from "@/app/actions/formulas";
import { getGroups } from "@/app/actions/groups";
import { getPhases } from "@/app/actions/phases";
import { getIndicators } from "@/app/actions/indicators";
import { getConstants, getVariables } from "@/app/actions/params";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SettingsPageLayout } from "../shared/SettingsPageLayout";

interface Formula {
  id: string;
  nome: string;
  descricao: string;
  expressao: string;
  grupoId: string;
  isPrincipal: boolean;
  exigeGeolocalizacao: boolean;
  exigePeriodo: boolean;
  grupo: { nome: string; sigla: string };
  fases: { faseId: string; fase: { nome: string } }[];
  criadoPor: { name: string | null };
}

export function FormulaList() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dependencies for Modal
  const [groups, setGroups] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [constants, setConstants] = useState<any[]>([]);
  const [variables, setVariables] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Formula | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
    loadDependencies();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getFormulas();
      if (result.success && result.data) {
        setFormulas(result.data as any[]);
      }
    } catch (error) {
      toast.error("Erro ao carregar fórmulas.");
    }
    setIsLoading(false);
  };

  const loadDependencies = async () => {
    const [g, p, i, c, v] = await Promise.all([
        getGroups(),
        getPhases(),
        getIndicators(),
        getConstants(),
        getVariables()
    ]);

    if (g.success) setGroups(g.data as any[]);
    if (p.success) setPhases(p.data as any[]);
    if (i.success) setIndicators(i.data as any[]);
    if (c.success) setConstants(c.data as any[]);
    if (v.success) setVariables(v.data as any[]);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Formula) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fórmula?")) return;
    const result = await deleteFormula(id);
    if (result.success) {
      toast.success("Fórmula excluída com sucesso");
      loadData();
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    if (editingItem) {
      result = await updateFormula(editingItem.id, formData);
    } else {
      result = await createFormula(formData);
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

  const filteredFormulas = formulas.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.grupo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SettingsPageLayout
        title="Fórmulas de Cálculo"
        description="Gerencie as expressões matemáticas que definem os índices de desempenho."
        icon={Sigma}
        onNew={handleCreate}
        newLabel="Nova Fórmula"
        searchPlaceholder="Buscar por nome ou grupo..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        stats={[
           { label: "Total de Fórmulas", value: formulas.length },
           { label: "Principais", value: formulas.filter(f => f.isPrincipal).length, trend: "KPIs", trendUp: true },
           { label: "Grupos Cobertos", value: new Set(formulas.map(f => f.grupoId)).size, trend: "Abrangência", trendUp: true }
        ]}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p>Carregando banco de fórmulas...</p>
          </div>
        ) : filteredFormulas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Calculator className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white">
               {searchTerm ? "Nenhuma fórmula encontrada." : "Nenhuma fórmula cadastrada."}
            </p>
            {!searchTerm && <Button variant="link" onClick={handleCreate} className="text-indigo-600">Criar primeira</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 dark:bg-transparent p-6">
            <AnimatePresence mode="popLayout">
              {filteredFormulas.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-indigo-500/50 opacity-0 transition-opacity group-hover:opacity-100" />

                  {/* Header/Actions */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                     <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 bg-white/80 dark:bg-black/50 backdrop-blur text-slate-500 hover:text-indigo-600 shadow-sm rounded-full">
                        <Pencil className="w-4 h-4" />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 bg-white/80 dark:bg-black/50 backdrop-blur text-slate-500 hover:text-red-600 shadow-sm rounded-full">
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>

                  <div className="p-6">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                           {item.grupo.sigla}
                        </span>
                        {item.isPrincipal && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/10 text-[10px] font-bold tracking-wider text-amber-700 dark:text-amber-500 uppercase">
                                <Sigma className="w-3 h-3" /> PRINCIPAL
                            </span>
                        )}
                      </div>
                      
                      <div className="mb-6">
                          <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2 line-clamp-1" title={item.nome}>{item.nome}</h3>
                          {item.descricao && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.descricao}</p>}
                      </div>
                      
                      {/* Code Block */}
                      <div className="relative group/code">
                          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover/code:opacity-100 transition-opacity duration-500" />
                          <div className="relative rounded-xl bg-slate-900 dark:bg-black border border-slate-800 dark:border-white/10 p-4 font-mono text-sm shadow-inner">
                              <div className="flex items-center gap-1.5 mb-2 opacity-50">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                              </div>
                              <div className="overflow-x-auto whitespace-nowrap scrollbar-hide text-indigo-300">
                                  {item.expressao}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-slate-50/50 dark:bg-white/5 p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                          <FileWarning className="w-3.5 h-3.5 text-slate-400" />
                          {item.fases.length} fases aplicáveis
                      </div>
                      <div className="flex items-center gap-2">
                          {item.exigeGeolocalizacao && <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500" />Geo</span>}
                          {item.exigePeriodo && <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-blue-500" />Período</span>}
                      </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </SettingsPageLayout>

      <FormulaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
        groups={groups}
        phases={phases}
        indicators={indicators}
        constants={constants}
        variables={variables}
        isLoading={isSaving}
      />
    </>
  );
}
