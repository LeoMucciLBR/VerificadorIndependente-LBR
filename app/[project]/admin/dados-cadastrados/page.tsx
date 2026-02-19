"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  Layers, 
  Calendar, 
  AlertCircle, 
  FileText, 
  Activity,
  BarChart3,
  Folder,
  Loader2,
  TrendingUp,
  Package
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Stats {
  indicadores: number;
  grupos: number;
  fases: number;
  ocorrencias: number;
  inspecoes: number;
  medicoes: number;
  caracterizacoes: number;
}

const CARD_CONFIG = [
  { key: "indicadores", label: "Indicadores", icon: Activity, color: "blue" },
  { key: "grupos", label: "Grupos", icon: Folder, color: "indigo" },
  { key: "fases", label: "Fases", icon: Calendar, color: "violet" },
  { key: "ocorrencias", label: "Ocorrências", icon: AlertCircle, color: "amber" },
  { key: "inspecoes", label: "Inspeções", icon: FileText, color: "cyan" },
  { key: "medicoes", label: "Medições", icon: BarChart3, color: "emerald" },
  { key: "caracterizacoes", label: "Caracterizações", icon: Layers, color: "rose" },
];

export default function DadosCadastradosPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [stats, setStats] = useState<Stats>({
    indicadores: 0,
    grupos: 0,
    fases: 0,
    ocorrencias: 0,
    inspecoes: 0,
    medicoes: 0,
    caracterizacoes: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>("indicadores");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, [projectId]);

  useEffect(() => {
    loadTabData(selectedTab);
  }, [selectedTab, projectId]);

  const loadStats = async () => {
    try {
      const [
        indicadoresRes,
        gruposRes,
        fasesRes,
        ocorrenciasRes,
        inspecoesRes,
        medicoesRes,
        caracterizacoesRes,
      ] = await Promise.all([
        fetch(`/api/indicadores?projectId=${projectId}`),
        fetch(`/api/grupos?projectId=${projectId}`),
        fetch(`/api/fases?projectId=${projectId}`),
        fetch(`/api/ocorrencias?limit=1000`),
        fetch(`/api/inspecoes?limit=1000`),
        fetch(`/api/medicoes?limit=1000`),
        fetch(`/api/caracterizacoes`),
      ]);

      const [
        indicadores,
        grupos,
        fases,
        ocorrencias,
        inspecoes,
        medicoes,
        caracterizacoes,
      ] = await Promise.all([
        indicadoresRes.json(),
        gruposRes.json(),
        fasesRes.json(),
        ocorrenciasRes.json(),
        inspecoesRes.json(),
        medicoesRes.json(),
        caracterizacoesRes.json(),
      ]);

      setStats({
        indicadores: indicadores.indicadores?.length || 0,
        grupos: grupos.grupos?.length || 0,
        fases: fases.fases?.length || 0,
        ocorrencias: ocorrencias.ocorrencias?.length || 0,
        inspecoes: inspecoes.inspecoes?.length || 0,
        medicoes: medicoes.medicoes?.length || 0,
        caracterizacoes: caracterizacoes.caracterizacoes?.length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string) => {
    setLoading(true);
    try {
      let endpoint = `/api/${tab}`;
      if (["indicadores", "grupos", "fases"].includes(tab)) {
        endpoint += `?projectId=${projectId}`;
      }
      
      const res = await fetch(endpoint);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(`Error loading ${tab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Dados Cadastrados
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Visualize e explore todos os dados do sistema
        </p>
      </motion.div>

      {/* Stats Cards - Bento Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {CARD_CONFIG.map((card, index) => {
          const Icon = card.icon;
          const isSelected = selectedTab === card.key;
          const count = stats[card.key as keyof Stats];
          
          return (
            <motion.button
              key={card.key}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.08, type: "spring" }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTab(card.key)}
              className={cn(
                "relative p-5 rounded-2xl transition-all text-left cursor-pointer overflow-hidden group",
                isSelected
                  ? "bg-blue-600 shadow-2xl ring-4 ring-blue-200 dark:ring-blue-800"
                  : "bg-white dark:bg-slate-800 hover:shadow-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
              )}
            >
              {/* Decorative blob */}
              <div className={cn(
                "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-opacity",
                isSelected ? "opacity-20" : "opacity-0 group-hover:opacity-10",
                "bg-blue-400"
              )} />

              <div className="relative z-10">
                <Icon className={cn(
                  "w-7 h-7 mb-3",
                  isSelected ? "text-white" : "text-blue-600"
                )} />
                
                <div className={cn(
                  "text-3xl font-bold mb-1 tabular-nums",
                  isSelected ? "text-white" : "text-blue-600"
                )}>
                  {loading ? "..." : count}
                </div>
                
                <div className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  isSelected ? "text-blue-100" : "text-slate-600 dark:text-slate-400"
                )}>
                  {card.label}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-2 left-2 right-2 h-1 bg-white/30 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Data Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-900/50 border-b-2 border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-3">
            {(() => {
              const card = CARD_CONFIG.find(c => c.key === selectedTab);
              if (!card) return null;
              const Icon = card.icon;
              return (
                <>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {card.label}
                </>
              );
            })()}
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-12 h-12 text-blue-600" />
              </motion.div>
            </div>
          ) : data ? (
            <div className="bg-slate-950 rounded-xl p-6 overflow-x-auto border border-slate-800">
              <pre className="text-sm text-emerald-400 font-mono leading-relaxed">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                {(() => {
                  const card = CARD_CONFIG.find(c => c.key === selectedTab);
                  if (!card) return null;
                  const Icon = card.icon;
                  return <Icon className="w-10 h-10 text-slate-400" />;
                })()}
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                Nenhum dado encontrado
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
