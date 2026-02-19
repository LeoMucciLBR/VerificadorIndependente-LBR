"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart2, Pencil, Trash2, Loader2, Plus, Search, Sparkles,
  TrendingUp, Target, Activity, Zap, Award, CheckCircle2,
  Route, Construction, AlertTriangle, Droplets, Building2, Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndicatorModal } from "./IndicatorModal";
import { getIndicators, createIndicator, updateIndicator, deleteIndicator } from "@/app/actions/indicators";
import { getGroups } from "@/app/actions/groups";
import { toast } from "sonner";
import { AreaAtuacao, AREA_ATUACAO_LABELS } from "@/types/enums";
import { cn } from "@/lib/utils";

interface Indicator {
  id: string;
  nome: string;
  descricao: string;
  sigla: string;
  unidadeMedida: string;
  areaAtuacao: AreaAtuacao;
  grupo_id: string;
  grupoId?: string; // Alias for Modal compatibility
  grupos?: {
    nome: string;
    sigla: string;
  };
  _count?: {
    caracterizacoes: number;
  };
}

interface GroupOption {
  id: string;
  nome: string;
  sigla: string;
}

const AREA_CONFIG: Record<AreaAtuacao, { color: string; icon: any; bgLight: string; bgDark: string }> = {
  [AreaAtuacao.FAIXA]: { 
    color: "from-blue-500 to-cyan-500", 
    icon: Route,
    bgLight: "bg-blue-500/10",
    bgDark: "dark:bg-blue-500/10"
  },
  [AreaAtuacao.PAVIMENTO]: { 
    color: "from-slate-500 to-zinc-600", 
    icon: Construction,
    bgLight: "bg-slate-500/10",
    bgDark: "dark:bg-slate-500/10"
  },
  [AreaAtuacao.SINALIZACAO]: { 
    color: "from-amber-500 to-orange-500", 
    icon: AlertTriangle,
    bgLight: "bg-amber-500/10",
    bgDark: "dark:bg-amber-500/10"
  },
  [AreaAtuacao.DRENAGEM]: { 
    color: "from-emerald-500 to-teal-600", 
    icon: Droplets,
    bgLight: "bg-emerald-500/10",
    bgDark: "dark:bg-emerald-500/10"
  },
  [AreaAtuacao.OBRAS_ARTE]: { 
    color: "from-purple-500 to-pink-600", 
    icon: Building2,
    bgLight: "bg-purple-500/10",
    bgDark: "dark:bg-purple-500/10"
  },
  [AreaAtuacao.MEIO_AMBIENTE]: { 
    color: "from-green-500 to-lime-600", 
    icon: Leaf,
    bgLight: "bg-green-500/10",
    bgDark: "dark:bg-green-500/10"
  },
  // Additional values from enum to satisfy Record<AreaAtuacao>
  [AreaAtuacao.INFRAESTRUTURA]: { 
    color: "from-indigo-500 to-violet-600", 
    icon: Building2,
    bgLight: "bg-indigo-500/10",
    bgDark: "dark:bg-indigo-500/10"
  },
  [AreaAtuacao.SOCIAL]: { 
    color: "from-rose-500 to-pink-600", 
    icon: Activity,
    bgLight: "bg-rose-500/10",
    bgDark: "dark:bg-rose-500/10"
  },
  [AreaAtuacao.ECONOMICO]: { 
    color: "from-yellow-500 to-amber-600", 
    icon: TrendingUp,
    bgLight: "bg-yellow-500/10",
    bgDark: "dark:bg-yellow-500/10"
  },
  [AreaAtuacao.GESTAO]: { 
    color: "from-cyan-500 to-blue-600", 
    icon: Target,
    bgLight: "bg-cyan-500/10",
    bgDark: "dark:bg-cyan-500/10"
  },
  [AreaAtuacao.QUALIDADE]: { 
    color: "from-teal-500 to-green-600", 
    icon: Award,
    bgLight: "bg-teal-500/10",
    bgDark: "dark:bg-teal-500/10"
  },
};

export function IndicatorList() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState<AreaAtuacao | "ALL">("ALL");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [indicatorsResult, groupsResult] = await Promise.all([
      getIndicators(),
      getGroups()
    ]);

    if (indicatorsResult.success && indicatorsResult.data) {
      setIndicators(indicatorsResult.data as Indicator[]);
    } else {
      toast.error("Erro ao carregar indicadores");
    }

    if (groupsResult.success && groupsResult.data) {
      setGroups(groupsResult.data.map((g: any) => ({
        id: g.id,
        nome: g.nome,
        sigla: g.sigla
      })));
    }

    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingIndicator(null);
    setIsModalOpen(true);
  };

  const handleEdit = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este indicador?")) return;
    const result = await deleteIndicator(id);
    if (result.success) {
      toast.success("Indicador excluído com sucesso");
      loadData();
    } else {
      toast.error(result.error || "Erro ao excluir indicador");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    if (editingIndicator) {
      result = await updateIndicator(editingIndicator.id, formData);
    } else {
      result = await createIndicator(formData);
    }

    if (result.success) {
      toast.success(editingIndicator ? "Indicador atualizado!" : "Indicador criado!");
      setIsModalOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Erro ao salvar indicador");
    }
    setIsSaving(false);
  };

  const filteredIndicators = indicators.filter(ind => {
    const matchesSearch = ind.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.grupos?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === "ALL" || ind.areaAtuacao === selectedArea;
    
    return matchesSearch && matchesArea;
  });

  const areaOptions = [
    { value: "ALL" as const, label: "Todos", count: indicators.length },
    ...Object.values(AreaAtuacao).map(area => ({
      value: area,
      label: AREA_ATUACAO_LABELS[area],
      count: indicators.filter(i => i.areaAtuacao === area).length
    }))
  ];

  const stats = [
    { label: "Total de Indicadores", value: indicators.length, icon: Target, color: "from-blue-500 to-cyan-500" },
    { label: "Áreas de Atuação", value: new Set(indicators.map(i => i.areaAtuacao)).size, icon: Activity, color: "from-purple-500 to-pink-500" },
    { label: "Com Caracterização", value: indicators.filter(i => (i._count?.caracterizacoes || 0) > 0).length, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-4 mb-3">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                >
                  <BarChart2 className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                    Indicadores de Desempenho
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-base mt-1">
                    Monitore e gerencie seus KPIs e métricas de performance
                  </p>
                </div>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleCreate}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 cursor-pointer h-12 px-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Indicador
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg border border-slate-200 dark:border-slate-700 group"
                >
                  <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br transition-opacity group-hover:opacity-10", stat.color)} />
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">{stat.label}</p>
                      <p className="text-5xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", stat.color)}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className={cn("absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r", stat.color)} />
                </motion.div>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar indicadores por nome, sigla ou grupo..."
                  className="pl-12 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {areaOptions.map((option) => {
                  const isActive = selectedArea === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedArea(option.value)}
                      className={cn(
                        "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer whitespace-nowrap",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      )}
                    >
                      {option.label} <span className="opacity-60">·</span> <span className="font-bold">{option.count}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-12 h-12 text-blue-600 mb-4" />
              </motion.div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando indicadores...</p>
            </div>
          ) : filteredIndicators.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 px-4"
            >
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-16 h-16 text-blue-600" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600"
                />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {searchTerm || selectedArea !== "ALL" ? "Nenhum resultado encontrado" : "Comece criando indicadores"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-8 text-lg">
                {searchTerm || selectedArea !== "ALL" 
                  ? "Tente ajustar os filtros ou a busca para encontrar o que procura"
                  : "Crie seu primeiro indicador para começar a monitorar o desempenho"}
              </p>
              {!searchTerm && selectedArea === "ALL" && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleCreate}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/30 cursor-pointer h-14 px-8 text-base"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Primeiro Indicador
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredIndicators.map((indicator, index) => {
                  const config = AREA_CONFIG[indicator.areaAtuacao];
                  const AreaIcon = config.icon;
                  
                  return (
                    <motion.div
                      key={indicator.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className="group relative"
                    >
                      {/* 3D Card Layers */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl transform transition-all duration-300 group-hover:scale-[1.02] shadow-xl group-hover:shadow-2xl" />
                      
                      {/* Gradient Top Border */}
                      <div className={cn("absolute top-0 left-0 right-0 h-2 bg-gradient-to-r rounded-t-2xl", config.color)} />

                      {/* Content */}
                      <div className="relative p-6 pt-8">
                        {/* Header with Icon */}
                        <div className="flex items-start gap-4 mb-5">
                          <motion.div 
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0", config.color)}
                          >
                            <AreaIcon className="w-7 h-7 text-white" />
                          </motion.div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                              {indicator.nome}
                            </h3>
                            <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                              {indicator.sigla}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(indicator)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(indicator.id)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Info Pills */}
                        <div className="space-y-2.5 mb-5">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Área de Atuação</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {AREA_ATUACAO_LABELS[indicator.areaAtuacao]}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Grupo</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate ml-4">
                              {indicator.grupos?.sigla || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Unidade</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {indicator.unidadeMedida}
                            </span>
                          </div>
                        </div>

                        {/* Footer Badge */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          {(indicator._count?.caracterizacoes || 0) > 0 ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10">
                              <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <motion.div 
                                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500"
                                />
                              </div>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {indicator._count?.caracterizacoes} caracterização{indicator._count?.caracterizacoes !== 1 ? 'ões' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Sem caracterização definida</span>
                          )}
                        </div>
                      </div>

                      {/* 3D Glow Effect */}
                      <div className={cn(
                        "absolute -inset-px bg-gradient-to-r opacity-0 group-hover:opacity-30 rounded-2xl blur-xl transition-opacity duration-300 -z-10",
                        config.color
                      )} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <IndicatorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingIndicator}
        groups={groups}
        isLoading={isSaving}
      />
    </div>
  );
}
