"use client";

import React from "react";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
    Calendar, Download, Eye, MapPin, 
    CheckCircle2, AlertCircle, Clock, Sparkles, 
    ArrowRight, Activity
} from "lucide-react";

interface ExecutionCardProps {
    execution: any;
    index: number;
    isActive?: boolean;
    onView: () => void;
}

function ExecutionCard({ execution, index, isActive = false, onView }: ExecutionCardProps) {
    const isOfficial = execution.is_official;
    
    // Configuração de Status com cores vibrantes e modernas
    // Adaptado para funcionar bem em ambos os modos
    const statusConfig = {
        'Pendente': {
            startColor: '#f59e0b', // Amber 500
            endColor: '#d97706',   // Amber 600
            bg: 'bg-amber-100 dark:bg-amber-500/10',
            border: 'border-amber-200 dark:border-amber-500/20',
            text: 'text-amber-700 dark:text-amber-500',
            icon: AlertCircle,
            label: 'Pendente'
        },
        'Aprovado': {
            startColor: '#10b981', // Emerald 500
            endColor: '#059669',   // Emerald 600
            bg: 'bg-emerald-100 dark:bg-emerald-500/10',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            text: 'text-emerald-700 dark:text-emerald-500',
            icon: CheckCircle2,
            label: 'Aprovado'
        },
        'Concluido': {
            startColor: '#3b82f6', // Blue 500
            endColor: '#2563eb',   // Blue 600
            bg: 'bg-blue-100 dark:bg-blue-500/10',
            border: 'border-blue-200 dark:border-blue-500/20',
            text: 'text-blue-700 dark:text-blue-500',
            icon: CheckCircle2,
            label: 'Concluído'
        },
    }[execution.status as string] || {
        startColor: '#64748b',
        endColor: '#475569',
        bg: 'bg-slate-100 dark:bg-slate-500/10',
        border: 'border-slate-200 dark:border-slate-500/20',
        text: 'text-slate-600 dark:text-slate-400',
        icon: Clock,
        label: execution.status
    };

    const StatusIcon = statusConfig.icon;

    const formatDate = (date: string | Date) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short',
                year: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    // Card Animation - 3D Tilt suave
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 400, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 400, damping: 30 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["2deg", "-2deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-2deg", "2deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Lógica de Cores da Nota
    const noteValue = execution.nota != null ? parseFloat(execution.nota) : null;
    let noteStyles = {
        bg: 'bg-primary/5 dark:bg-primary/10',
        text: 'text-primary dark:text-primary/90',
        border: 'border-primary/20 dark:border-primary/30',
        cardBorder: 'border-slate-200 dark:border-white/5',
        shadow: 'hover:shadow-lg hover:shadow-primary/10',
        barGradient: 'bg-gradient-to-r from-blue-600 to-blue-400', // Pure Blue
        label: 'N/A'
    };

    if (noteValue !== null) {
        if (noteValue >= 8.0) {
            noteStyles = {
                bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                text: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-200 dark:border-emerald-500/20',
                cardBorder: 'border-emerald-500/50 dark:border-emerald-500/30',
                shadow: 'hover:shadow-xl hover:shadow-emerald-500/20',
                barGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
                label: 'Alta'
            };
        } else if (noteValue >= 5.0) {
            noteStyles = {
                bg: 'bg-amber-50 dark:bg-amber-500/10',
                text: 'text-amber-600 dark:text-amber-400',
                border: 'border-amber-200 dark:border-amber-500/20',
                cardBorder: 'border-amber-500/50 dark:border-amber-500/30',
                shadow: 'hover:shadow-xl hover:shadow-amber-500/20',
                barGradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
                label: 'Médio'
            };
        } else {
            noteStyles = {
                bg: 'bg-rose-50 dark:bg-rose-500/10',
                text: 'text-rose-600 dark:text-rose-400',
                border: 'border-rose-200 dark:border-rose-500/20',
                cardBorder: 'border-rose-500/50 dark:border-rose-500/30',
                shadow: 'hover:shadow-xl hover:shadow-rose-500/20',
                barGradient: 'bg-gradient-to-r from-rose-500 to-rose-600',
                label: 'Baixo'
            };
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            style={{ perspective: 1000 }}
            className="h-full"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={onView}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`
                    group relative h-full flex flex-col justify-between
                    bg-white dark:bg-[#0f172a] 
                    border ${isActive ? 'border-transparent' : noteStyles.cardBorder}
                    rounded-2xl cursor-pointer
                    overflow-hidden
                    shadow-sm dark:shadow-md dark:shadow-black/50
                    transition-all duration-300 ease-out
                    ${isActive ? 'shadow-[0_0_30px_rgba(34,197,94,0.15)]' : noteStyles.shadow}
                `}
            >
                {/* Active Indicator - Simple Green Dot (Slow Pulse) */}
                {isActive && (
                    <div className="absolute top-4 right-4 z-20 flex items-center justify-center pointer-events-none">
                        <motion.span 
                            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                            className="absolute inline-flex h-3 w-3 rounded-full bg-green-500" 
                        />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-md shadow-green-500/50" />
                    </div>
                )}
                
                {/* Active Rotating Border Effect - Continuous Pulse - Refined */}
                {isActive && (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl">
                         <motion.div 
                            animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }}
                            transition={{ 
                                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(transparent,rgba(34,197,94,0.8),transparent)]"
                         />
                         <div className="absolute inset-0 bg-white dark:bg-[#0f172a] m-[1.5px] rounded-2xl" />
                    </div>
                )}
                
                {/* Efeito de brilho no background seguindo o mouse */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-soft-light"
                    style={{
                        background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.4), transparent 40%)`
                    }}
                />
                
                {/* Linha de gradiente no topo - Oculta se ativo para não conflitar com a borda verde */}
                {!isActive && (
                    <div className="relative w-full h-1">
                         <div className={`absolute inset-0 ${noteStyles.barGradient}`} />
                    </div>
                )}

                <div 
                    className="p-6 flex flex-col h-full relative z-10"
                    style={{ transform: "translateZ(30px)" }}
                >
                    
                    {/* Header: Nota/Icone + Título */}
                    <div className="flex items-start gap-3 mb-3">
                        {/* Nota com Cores Dinâmicas */}
                        <div className={`
                            group/nota relative flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center
                            ${noteStyles.bg} ${noteStyles.text} border ${noteStyles.border}
                            transition-all duration-300
                        `}>
                            {execution.nota != null ? (
                                <>
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-0.5">Nota</span>
                                    <span className="text-2xl font-black leading-none tracking-tight">{execution.nota}</span>
                                </>
                            ) : (
                                <Activity className="w-6 h-6 opacity-50" />
                            )}
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight group-hover:text-primary transition-colors leading-snug">
                                {execution.fase?.nome || "Fase Inicial"}
                            </h3>
                            
                            {/* Localização: Projeto + Rodovia */}
                            {execution.project?.nome && (
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                                    {execution.project.nome}
                                </span>
                            )}
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
                                <span>{execution.rodovias?.nome || "Rodovia não informada"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Oficial Badge (se houver) */}
                    {!!isOfficial && (
                        <div className="mb-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                                <Sparkles className="w-3 h-3" /> Oficial
                            </span>
                        </div>
                    )}

                    {/* Descrição */}
                    <div className="flex-grow">
                        <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                            {execution.descricaoVistoria || "Sem descrição informada para esta vistoria."}
                        </p>
                    </div>

                    {/* Meta Dados (Grid) - Datas voltam para cá */}
                    <div className="grid grid-cols-1 gap-4 pb-4 border-b border-slate-100 dark:border-white/5 mt-auto">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs bg-slate-50 dark:bg-white/5 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                            <div className="p-1.5 bg-white dark:bg-white/5 rounded-md shadow-sm text-slate-400 dark:text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-0.5">Período de Referência</span>
                                <span className="font-medium">{formatDate(execution.dataInicioVistoria)} - {formatDate(execution.dataFimVistoria)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 flex items-center justify-between pt-1">
                         <span className="text-slate-400 dark:text-slate-600 text-[10px] font-mono opacity-60">
                            ID: {String(execution.id).padStart(4, '0')}
                        </span>

                        <div className="flex items-center gap-2">
                             <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="Baixar Relatório"
                            >
                                <Download className="w-4 h-4" />
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group/btn flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-primary dark:hover:bg-primary border border-slate-200 dark:border-white/5 text-sm font-medium text-slate-600 dark:text-white hover:text-white transition-all hover:border-primary"
                                onClick={(e) => { e.stopPropagation(); onView(); }}
                            >
                                <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                <span>Detalhes</span>
                                <ArrowRight className="w-3 h-3 opacity-50 group-hover/btn:translate-x-0.5 transition-transform" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default React.memo(ExecutionCard);
