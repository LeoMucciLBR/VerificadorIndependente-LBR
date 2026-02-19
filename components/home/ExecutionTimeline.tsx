
"use client";

import { motion } from "framer-motion";
import { Star, CalendarDays, MapPin, User, Flag, CheckCircle2, Clock, AlertTriangle, FileText, Building2, Activity, AlertCircle, Sparkles, Calendar, BarChart3, Calculator } from "lucide-react";
import { ExpandableCard } from "../ui/expandable-card";
import { useRef, useEffect } from "react";

interface Execution {
  id: string;
  periodoReferencia: string | null;
  dataInicioVistoria: string | null;
  dataFimVistoria: string | null;
  descricaoVistoria: string;
  status: string;
  nota: number | null;
  isOfficial: boolean;
  faseNome: string;
  rodoviaNome: string;
  rodoviaCodigo: string;
  userName: string;
  projectNome: string;
  ocorrenciasCount: number;
  indicadores: { id: string; sigla: string; nome: string; count: number }[];
  formulas: { id: number; nome: string; descricao: string; expressao: string; isPrincipal: boolean }[];
}

interface ExecutionTimelineProps {
  executions: Execution[];
}

function formatPeriodLabel(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return "—"; }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  } catch { return "—"; }
}

function formatDateRange(start: string | null, end: string | null): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s === "—" && e === "—") return "—";
  if (s === "—") return e;
  if (e === "—") return s;
  return `${s} à ${e}`;
}

function calcDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  try {
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";
    const days = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} dias de duração`;
  } catch { return ""; }
}

const getScoreTextColor = (score: number | null) => {
  if (score == null) return "text-slate-400";
  if (score >= 8) return "text-emerald-500";
  if (score >= 5) return "text-amber-500";
  return "text-red-500";
};

const getTimelineDotColor = (score: number | null) => {
  if (score == null) return "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.5)]";
  if (score >= 8) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
  if (score >= 5) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
  return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
};

function getNoteStyles(nota: number | null) {
  if (nota == null) {
    return {
      bg: 'bg-slate-100 dark:bg-white/5',
      text: 'text-slate-500 dark:text-slate-400',
      border: 'border-slate-200 dark:border-white/10',
      label: 'N/A'
    };
  }
  if (nota >= 8.0) {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-500/20',
      label: 'Alta'
    };
  }
  if (nota >= 5.0) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-500/20',
      label: 'Médio'
    };
  }
  return {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/20',
    label: 'Baixo'
  };
}

function getStatusConfig(status: string) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
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
  };
  return map[status] || {
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700'
  };
}

/** Expanded card content — mirrors ExecutionDetailsModal layout */
function ExecutionExpandedContent({ execution }: { execution: Execution }) {
  const noteStyles = getNoteStyles(execution.nota);
  const statusConfig = getStatusConfig(execution.status);
  const duration = calcDuration(execution.dataInicioVistoria, execution.dataFimVistoria);

  return (
    <div className="w-full space-y-6">
      {/* Header badges row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Nota badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${noteStyles.bg} ${noteStyles.border} ${noteStyles.text}`}>
          <span className="opacity-70 text-[10px]">Nota</span>
          <span className="text-sm">{execution.nota != null ? execution.nota.toFixed(1) : "-"}</span>
        </div>
        {/* Status badge */}
        <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
          {execution.status}
        </span>
        {/* Official badge */}
        {execution.isOfficial && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
            <Sparkles className="w-3 h-3" /> Oficial
          </span>
        )}
        <span className="text-xs font-mono text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
          ID: {execution.id.padStart(4, '0')}
        </span>
      </div>

      {/* Rodovia + Projeto + Ref + Fase */}
      <div>
        <h4 className="text-xl font-bold text-black dark:text-white tracking-tight">{execution.rodoviaNome}</h4>
        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-medium text-xs">
            {execution.projectNome}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Ref: {formatPeriodLabel(execution.periodoReferencia)}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Fase: <span className="text-slate-700 dark:text-slate-300 font-medium">{execution.faseNome}</span>
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoBlock icon={Building2} label="Responsável" value={execution.userName} />
        <InfoBlock
          icon={CalendarDays}
          label="Período de Vistoria"
          value={formatDateRange(execution.dataInicioVistoria, execution.dataFimVistoria)}
          subValue={duration}
        />
      </div>

      {/* Ocorrências count */}
      <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 flex items-center gap-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600/70 dark:text-amber-400/70">Ocorrências Identificadas</div>
          <div className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {execution.ocorrenciasCount}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">registros encontrados</span>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      {execution.indicadores.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 pl-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Indicadores
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  <th className="text-left px-4 py-2 font-semibold text-xs uppercase tracking-wider">Sigla</th>
                  <th className="text-left px-4 py-2 font-semibold text-xs uppercase tracking-wider">Indicador</th>
                  <th className="text-right px-4 py-2 font-semibold text-xs uppercase tracking-wider">Ocorrências</th>
                </tr>
              </thead>
              <tbody>
                {execution.indicadores.map((ind) => (
                  <tr key={ind.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">{ind.sigla}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-white">{ind.nome}</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-white">{ind.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fórmulas de Cálculo */}
      {execution.formulas.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 pl-1">
            <Calculator className="w-4 h-4 text-violet-500" />
            Fórmulas de Cálculo
          </h3>
          <div className="space-y-3">
            {execution.formulas.map((f: any) => (
              <div key={f.id} className="bg-slate-50 dark:bg-[#1e293b]/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800 dark:text-white text-sm">{f.nome}</span>
                  {f.isPrincipal && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Principal</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{f.descricao}</p>
                <code className="text-xs font-mono bg-slate-200/70 dark:bg-black/30 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                  {f.expressao}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descrição da Vistoria */}
      {execution.descricaoVistoria && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 pl-1">
            <FileText className="w-4 h-4 text-blue-500" />
            Detalhes da Vistoria
          </h3>
          <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-4 rounded-xl border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-mono">
            {execution.descricaoVistoria}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value, subValue }: { icon: any; label: string; value: string; subValue?: string }) {
  return (
    <div className="bg-slate-50 dark:bg-[#1e293b]/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-1 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-500">{label}</span>
      </div>
      <div className="text-slate-800 dark:text-white font-medium">{value}</div>
      {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
    </div>
  );
}

export const ExecutionTimeline = ({ executions }: ExecutionTimelineProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeline = timelineRef.current;
    
    const handleWheel = (e: WheelEvent) => {
      if (scrollContainerRef.current) {
        e.preventDefault();
        scrollContainerRef.current.scrollLeft += e.deltaY * 1.2;
      }
    };

    if (timeline) {
      timeline.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (timeline) {
        timeline.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  if (executions.length === 0) {
    return (
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Histórico de Execuções
            </h2>
            <p className="text-slate-400">
              Acompanhe o desempenho das inspeções ao longo do tempo
            </p>
          </motion.div>
          <div className="text-center py-16 text-slate-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhuma execução cadastrada ainda.</p>
            <p className="text-sm mt-1">As execuções aparecerão aqui conforme forem criadas.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Histórico de Execuções
          </h2>
          <p className="text-slate-400">
            Acompanhe o desempenho das inspeções ao longo do tempo
          </p>
        </motion.div>

        {/* Desktop - Zig-Zag Timeline */}
        <div 
          ref={timelineRef}
          className="hidden lg:block relative py-8"
        >
          {/* Central Timeline Axis */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ originX: 0 }}
            className="absolute top-1/2 left-0 right-0 h-[3px] bg-blue-500/60 -translate-y-1/2 z-10" 
          />

          {/* Scroll Container */}
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-visible px-4 pb-8 pt-8 w-full" 
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex relative min-w-max h-[320px] items-center px-8">
              {executions.map((execution, index) => {
                  const isTop = index % 2 === 0;
                  const dotDelay = 0.5 + index * 0.15;
                  
                  // Card compact: fase (título), rodovia + data + período (descrição)
                  const cardTitle = execution.faseNome || 'Fase Inicial';
                  const periodLabel = formatPeriodLabel(execution.periodoReferencia);
                  const rodoviaTxt = execution.rodoviaNome || execution.rodoviaCodigo || '';
                  const dateTxt = formatDate(execution.dataInicioVistoria);
                  const cardDescription = [rodoviaTxt, dateTxt !== '—' ? dateTxt : '', periodLabel].filter(Boolean).join('\n');
                  
                  return (
                    <div 
                      key={execution.id} 
                      className="relative w-[210px] h-full mx-2 flex-shrink-0"
                    >
                        <div className={`absolute left-0 right-0 ${isTop ? 'bottom-[calc(50%+20px)]' : 'top-[calc(50%+20px)]'}`}>
                             <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: isTop ? -20 : 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: dotDelay + 0.1, duration: 0.4 }}
                             >
                                <ExpandableCard
                                    title={cardTitle}
                                    description={cardDescription}
                                    score={execution.nota ?? undefined}
                                    className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700/50 shadow-lg w-full h-[140px] hover:bg-blue-100 dark:hover:bg-slate-700" 
                                    classNameExpanded="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700/50"
                                >
                                    <ExecutionExpandedContent execution={execution} />
                                </ExpandableCard>
                             </motion.div>
                        </div>

                        {/* Central Dot */}
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: dotDelay, duration: 0.3, type: "spring", stiffness: 300 }}
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${getTimelineDotColor(execution.nota)} z-20 border-4 border-background`} 
                        />

                        {/* Connector Line */}
                        <motion.div 
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: dotDelay + 0.05, duration: 0.2 }}
                            style={{ originY: isTop ? 1 : 0 }}
                            className={`absolute left-1/2 -translate-x-1/2 w-[2px] bg-slate-600/80 z-5 ${isTop ? 'bottom-[50%] h-[20px]' : 'top-[50%] h-[20px]'}`} 
                        />

                    </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile - Vertical list */}
        <div className="lg:hidden space-y-6">
          <div className="absolute left-6 top-24 bottom-24 w-px bg-zinc-800/50 -z-10" /> 
          
          {executions.map((execution, index) => {
            const cardTitle = execution.faseNome || 'Fase Inicial';
            const periodLabel = formatPeriodLabel(execution.periodoReferencia);
            const rodoviaTxt = execution.rodoviaNome || execution.rodoviaCodigo || '';
            const dateTxt = formatDate(execution.dataInicioVistoria);
            const cardDescription = [rodoviaTxt, dateTxt !== '—' ? dateTxt : '', periodLabel].filter(Boolean).join('\n');

            return (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative pl-6"
              >
                 <div className={`absolute left-[-5px] top-6 w-3 h-3 rounded-full ${getTimelineDotColor(execution.nota)} ring-4 ring-background z-10`} />

                <ExpandableCard
                  title={cardTitle}
                  description={cardDescription}
                  score={execution.nota ?? undefined}
                  classNameExpanded="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700/50"
                >
                  <ExecutionExpandedContent execution={execution} />
                </ExpandableCard>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-wrap justify-center gap-6 mt-12 text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-white/70">Conformidade Alta (8.0+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-white/70">Atenção (5.0 - 7.9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-white/70">Crítico (&lt; 5.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-white/70">Sem nota</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
