"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, Calendar, Building2, AlertCircle, Calculator, FileText, Activity, MapPin, Hash, Sparkles, Images, FileDown, Loader2 } from "lucide-react";
import InspecaoOccurrencesModal from "./InspecaoOccurrencesModal";

type ExecutionDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  execution: any;
};

export default function ExecutionDetailsModal({ isOpen, onClose, execution }: ExecutionDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showOccurrencesModal, setShowOccurrencesModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownloadPdf = async () => {
    if (!execution?.id) return;
    setIsGeneratingPdf(true);
    try {
      const response = await fetch(`/api/execucoes/${execution.id}/relatorio-pdf`);
      if (!response.ok) throw new Error("Erro ao gerar PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split('filename="')[1]?.replace('"', '') || `relatorio-execucao-${execution.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!execution || !mounted) return null;

  const { rodovias, fase, users, ocorrencias, status, dataInicioVistoria, dataFimVistoria, periodoReferencia, is_official, descricaoVistoria, id, nota, project } = execution;
  const rodoviaName = rodovias?.nome || "Rodovia Desconhecida";
  const projectName = project?.nome || "Projeto não identificado";
  const instituicao = users?.instituicao?.nome || "Não identificada";
  const responsavel = users?.name || "Desconhecido";

  // Lógica de Cores da Nota
  const noteValue = nota != null ? parseFloat(nota) : null;
  let noteStyles = {
        bg: 'bg-slate-100 dark:bg-white/5',
        text: 'text-slate-500 dark:text-slate-400',
        border: 'border-slate-200 dark:border-white/10',
        label: 'N/A'
  };

    if (noteValue !== null) {
        if (noteValue >= 8.0) {
            noteStyles = {
                bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                text: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-200 dark:border-emerald-500/20',
                label: 'Alta'
            };
        } else if (noteValue >= 5.0) {
            noteStyles = {
                bg: 'bg-amber-50 dark:bg-amber-500/10',
                text: 'text-amber-600 dark:text-amber-400',
                border: 'border-amber-200 dark:border-amber-500/20',
                label: 'Médio'
            };
        } else {
            noteStyles = {
                bg: 'bg-rose-50 dark:bg-rose-500/10',
                text: 'text-rose-600 dark:text-rose-400',
                border: 'border-rose-200 dark:border-rose-500/20',
                label: 'Baixo'
            };
        }
    }

  // Aggregate Indicators
  const indicatorsMap = new Map();
  if (ocorrencias) {
      ocorrencias.forEach((oc: any) => {
          if (oc.indicadores && oc.indicadores.id) {
              const ind = oc.indicadores;
              const indId = String(ind.id);
              if (!indicatorsMap.has(indId)) {
                  indicatorsMap.set(indId, { ...ind, id: indId, count: 0 });
              }
              indicatorsMap.get(indId).count++;
          }
      });
  }
  const indicatorsList = Array.from(indicatorsMap.values());
  const formulas = fase?.formulas_fases?.map((ff: any) => ff.formulas) || [];

  // Status Configuration for Badges (Light/Dark support)
  const statusConfig = {
      'Pendente': { 
          color: 'text-amber-600 dark:text-amber-500', 
          bg: 'bg-amber-50 dark:bg-amber-950/30', 
          border: 'border-amber-100 dark:border-amber-900/50' 
      },
      'Aprovado': { 
          color: 'text-emerald-600 dark:text-emerald-500', 
          bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
          border: 'border-emerald-100 dark:border-emerald-900/50' 
      },
      'Concluido': { 
          color: 'text-blue-600 dark:text-blue-500', 
          bg: 'bg-blue-50 dark:bg-blue-950/30', 
          border: 'border-blue-100 dark:border-blue-900/50' 
      },
  }[status as string] || { 
      color: 'text-slate-500 dark:text-slate-400', 
      bg: 'bg-slate-100 dark:bg-slate-800', 
      border: 'border-slate-200 dark:border-slate-700' 
  };

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 md:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/60 dark:bg-[#020617]/80 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div 
             initial={{ scale: 0.95, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.95, opacity: 0, y: 20 }}
             transition={{ type: "spring", damping: 30, stiffness: 300 }}
             className="
                relative w-full max-w-4xl max-h-[90vh] 
                bg-white dark:bg-[#0f172a] 
                border border-slate-200 dark:border-white/10 
                rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50
                flex flex-col overflow-hidden text-slate-900 dark:text-white
             "
          >
            {/* Header - Technical */}
            <motion.div 
                className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        {/* Nota Visual */}
                        <div className={`
                            flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border
                            ${noteStyles.bg} ${noteStyles.border} ${noteStyles.text}
                        `}>
                            <span className="opacity-70 text-[10px]">Nota</span>
                            <span className="text-sm">{nota || "-"}</span>
                        </div>

                        <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
                            {status}
                        </span>
                        {!!is_official && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                                <Sparkles className="w-3 h-3" /> Oficial
                            </span>
                        )}
                         <span className="text-xs font-mono text-slate-500 dark:text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                            ID: {String(id).padStart(4, '0')}
                         </span>
                     </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            {rodoviaName}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-medium text-xs">
                                {projectName}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                Ref: {new Date(periodoReferencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                Fase: <span className="text-slate-700 dark:text-slate-300 font-medium">{fase?.nome || "N/A"}</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                      onClick={onClose}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:hover:border-white/5"
                    >
                      <X className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>

            {/* Scrollable Content */}
            <motion.div 
                className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-white dark:bg-[#0f172a]"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                
                {/* Info Grid - Blocks */}
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={itemVariants}>
                    <InfoBlock icon={Building2} label="Instituição Responsável" value={instituicao} subValue={responsavel} />
                    <InfoBlock 
                        icon={Calendar} 
                        label="Período de Vistoria" 
                        value={`${new Date(dataInicioVistoria).toLocaleDateString('pt-BR')} - ${new Date(dataFimVistoria).toLocaleDateString('pt-BR')}`} 
                        subValue={`${Math.ceil((new Date(dataFimVistoria).getTime() - new Date(dataInicioVistoria).getTime()) / (1000 * 60 * 60 * 24))} dias de duração`}
                    />
                    <motion.div 
                        layoutId="occurrences-modal-trigger"
                        onClick={() => setShowOccurrencesModal(true)}
                        className="col-span-1 md:col-span-2 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all group shadow-sm"
                    >
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600/70 dark:text-amber-400/70">Ocorrências Identificadas</div>
                                <div className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {ocorrencias?.length || 0}
                                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">registros encontrados</span>
                                </div>
                            </div>
                         </div>
                         <div className="px-4 py-2 bg-white dark:bg-white/10 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-200 shadow-sm group-hover:shadow group-hover:translate-x-1 transition-all">
                            Visualizar Galeria
                         </div>
                    </motion.div>
                </motion.div>

                {/* Description - Technical Box */}
                <motion.div variants={itemVariants}>
                    <Section title="Detalhes da Vistoria" icon={FileText} accentColor="text-blue-500">
                        <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-5 rounded-xl border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-mono">
                            {descricaoVistoria || "Nenhuma descrição técnica fornecida."}
                        </div>
                    </Section>
                </motion.div>

                {/* Indicators Table */}
                <motion.div variants={itemVariants}>
                    <Section title="Indicadores Identificados" icon={AlertCircle} accentColor="text-amber-500">
                        {indicatorsList.length > 0 ? (
                            <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/30 overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white dark:bg-white/[0.02] text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-5 py-3">Indicador</th>
                                            <th className="px-5 py-3 text-right">Qtd</th>
                                            <th className="px-5 py-3 text-right">Nota Prep.</th>
                                            <th className="px-5 py-3 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {indicatorsList.map((ind: any, i: number) => (
                                            <tr key={ind.id ? String(ind.id) : `ind-${i}`} className="hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-colors bg-white dark:bg-transparent">
                                                <td className="px-5 py-3">
                                                    <div className="font-mono text-slate-800 dark:text-white font-medium">{ind.sigla}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-500">{ind.name}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                                                    {ind.count}
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-400 dark:text-slate-500 font-mono">
                                                    -
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline decoration-blue-500/30 font-medium">
                                                        Detalhes
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState message="Nenhum indicador registrado." />
                        )}
                    </Section>
                </motion.div>

                {/* Formulas - Math Blocks */}
                <motion.div variants={itemVariants}>
                    <Section title="Fórmulas de Cálculo" icon={Calculator} accentColor="text-purple-500">
                        <div className="grid gap-3">
                            {formulas.map((formula: any, index: number) => (
                                <div key={formula?.id ? String(formula.id) : `formula-${index}`} className="bg-slate-50 dark:bg-[#1e293b]/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-3 group hover:border-slate-300 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">{formula.nome}</span>
                                        {formula.isPrincipal && (
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                                                Principal
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-mono text-xs bg-white dark:bg-[#020617] p-3 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 overflow-x-auto whitespace-nowrap shadow-inner">
                                        {formula.expressao}
                                    </div>
                                </div>
                            ))}
                             {formulas.length === 0 && <EmptyState message="Nenhuma fórmula associada." />}
                        </div>
                    </Section>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.div 
                className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/30 flex justify-end gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <button 
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGeneratingPdf ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                  ) : (
                    <><FileDown className="w-4 h-4" /> Gerar Relatório PDF</>
                  )}
                </button>
                <button 
                  onClick={onClose}
                  className="px-5 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-lg transition-colors border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none"
                >
                  Fechar
                </button>
            </motion.div>

          </motion.div>
        </div>
      )}
      
      {/* Occurrences Gallery Modal */}
      <InspecaoOccurrencesModal 
          isOpen={showOccurrencesModal} 
          onClose={() => setShowOccurrencesModal(false)} 
          ocorrencias={ocorrencias} 
          rodovia={rodovias}
      />

    </AnimatePresence>,
    document.body
  );
}

// Subcomponents
function InfoBlock({ icon: Icon, label, value, subValue }: any) {
    return (
        <div className="bg-slate-50 dark:bg-[#1e293b]/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-1 hover:border-slate-300 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-500">{label}</span>
            </div>
            <div className="text-slate-800 dark:text-white font-medium">{value}</div>
            {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
        </div>
    );
}

function Section({ title, icon: Icon, children, accentColor }: any) {
    return (
        <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 pl-1">
                <Icon className={`w-4 h-4 ${accentColor}`} /> 
                {title}
            </h3>
            {children}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/[0.01] text-slate-500 text-sm">
            {message}
        </div>
    );
}
