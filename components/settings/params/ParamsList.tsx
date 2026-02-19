"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Binary, Variable, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParamModal, ParamType } from "./ParamModal";
import { 
  getConstants, createConstant, updateConstant, deleteConstant,
  getVariables, createVariable, updateVariable, deleteVariable
} from "@/app/actions/params";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Constant {
  id: string;
  nome: string;
  valor: number;
}

interface VariableItem {
  id: string;
  nome: string;
  valorPadrao: number;
}

// Union type for interal handling
type ParamItem = (Constant | VariableItem) & { type: ParamType };

export function ParamsList() {
  const [activeTab, setActiveTab] = useState<ParamType>('constant');
  const [constants, setConstants] = useState<Constant[]>([]);
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ParamItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [constRes, varRes] = await Promise.all([
        getConstants(),
        getVariables()
      ]);

      if (constRes.success && constRes.data) setConstants(constRes.data);
      if (varRes.success && varRes.data) setVariables(varRes.data);
      
    } catch (error) {
      toast.error("Erro ao carregar parâmetros.");
    }
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Constant | VariableItem, type: ParamType) => {
    // @ts-ignore - union type complexity
    setEditingItem({ ...item, type });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: ParamType) => {
    if (!confirm(`Tem certeza que deseja excluir esta ${type === 'constant' ? 'constante' : 'variável'}?`)) return;
    
    let result;
    if (type === 'constant') {
      result = await deleteConstant(id);
    } else {
      result = await deleteVariable(id);
    }

    if (result.success) {
      toast.success("Item excluído com sucesso");
      loadData();
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    const isEdit = !!editingItem;
    
    // Determine action based on active tab or editing item type
    const targetType = editingItem?.type || activeTab;

    if (targetType === 'constant') {
      if (isEdit) result = await updateConstant(editingItem!.id, formData);
      else result = await createConstant(formData);
    } else {
      if (isEdit) result = await updateVariable(editingItem!.id, formData);
      else result = await createVariable(formData);
    }

    if (result.success) {
      toast.success(isEdit ? "Atualizado com sucesso!" : "Criado com sucesso!");
      setIsModalOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Erro ao salvar");
    }
    setIsSaving(false);
  };

  const currentItems = activeTab === 'constant' ? constants : variables;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
            Parâmetros de Cálculo
          </h1>
          <p className="text-foreground/60 text-lg max-w-2xl">
            Gerencie constantes e variáveis utilizadas nas fórmulas.
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova {activeTab === 'constant' ? 'Constante' : 'Variável'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white dark:bg-zinc-900 border border-border/10 rounded-xl mb-6 self-start">
        <button
          onClick={() => setActiveTab('constant')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeTab === 'constant' 
              ? "bg-blue-500/10 text-blue-600 shadow-sm ring-1 ring-blue-500/20" 
              : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <Binary className="w-4 h-4" />
          Constantes
        </button>
        <button
          onClick={() => setActiveTab('variable')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeTab === 'variable' 
              ? "bg-blue-500/10 text-blue-600 shadow-sm ring-1 ring-blue-500/20" 
              : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <Variable className="w-4 h-4" />
          Variáveis
        </button>
      </div>

      {/* List Content */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-foreground/50 gap-3 border border-border/10 rounded-xl bg-white dark:bg-white/5">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Carregando parâmetros...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-foreground/50 gap-3 border border-border/10 rounded-xl bg-white dark:bg-white/5">
            <Calculator className="w-12 h-12 opacity-20" />
            <p>Nenhum item cadastrado nesta categoria.</p>
            <Button variant="outline" onClick={handleCreate}>Criar agora</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {currentItems.map((item) => {
                // Normalize value accessor
                const value = 'valor' in item ? item.valor : item.valorPadrao;
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 rounded-xl p-5 shadow-sm hover:border-blue-500/30 transition-all group relative"
                  >
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item, activeTab)} className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, activeTab)} className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset",
                            activeTab === 'constant' 
                                ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" 
                                : "bg-orange-500/10 text-orange-500 ring-orange-500/20"
                        )}>
                            {activeTab === 'constant' ? <Binary className="w-5 h-5" /> : <Variable className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground">{item.nome}</h3>
                            <p className="text-xs text-foreground/50 uppercase tracking-wider">{activeTab === 'constant' ? 'Constante' : 'Variável'}</p>
                        </div>
                    </div>

                    <div className="bg-foreground/5 rounded-lg p-3 flex items-center justify-between border border-border/5">
                        <span className="text-xs text-foreground/50 font-mono">VALOR</span>
                        <span className="text-lg font-bold font-mono text-foreground">{value}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ParamModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        // @ts-ignore
        initialData={editingItem}
        type={editingItem?.type || activeTab}
        isLoading={isSaving}
      />
    </div>
  );
}
