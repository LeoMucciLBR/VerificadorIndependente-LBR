"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Search, X, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getExecutionDetails } from "@/app/actions/execucoes";
import ExecutionDetailsModal from "./ExecutionDetailsModal";
import ExecutionCard from "./ExecutionCard";

const ITEMS_PER_PAGE = 20;

export default function ExecutionList({ executions, activeExecutionId }: { executions: any[], activeExecutionId?: string }) {
    const [filter, setFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");
    const [selectedExecution, setSelectedExecution] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true });

    const filtered = useMemo(() => executions.filter(e => {
        const matchesSearch = 
            e.descricaoVistoria?.toLowerCase().includes(filter.toLowerCase()) ||
            e.rodovias?.nome?.toLowerCase().includes(filter.toLowerCase()) ||
            e.uuid?.toLowerCase().includes(filter.toLowerCase()); 
        
        const matchesStatus = statusFilter === "todos" || e.status === statusFilter;

        return matchesSearch && matchesStatus;
    }), [executions, filter, statusFilter]);

    const handleViewDetails = useCallback(async (id: string) => {
        setIsLoadingDetails(true);
        try {
            const result = await getExecutionDetails(id);
            if (result.success) {
                setSelectedExecution(result.data);
                setIsDetailsOpen(true);
            } else {
                toast.error("Erro", { description: result.error });
            }
        } catch (error) {
            toast.error("Erro", { description: "Falha ao carregar detalhes." });
        } finally {
            setIsLoadingDetails(false);
        }
    }, []);

    // Status filter options
    const statusOptions = [
        { value: 'todos', label: 'Todos', color: 'bg-slate-500' },
        { value: 'Pendente', label: 'Pendente', color: 'bg-amber-500' },
        { value: 'Aprovado', label: 'Aprovado', color: 'bg-emerald-500' },
        { value: 'Concluido', label: 'Concluído', color: 'bg-blue-500' },
    ];

    return (
        <div ref={containerRef} className="flex flex-col h-full bg-white dark:bg-[#0f172a]/50 backdrop-blur-3xl rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-2xl">
            {/* Toolbar Area */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                    
                    {/* Search Input */}
                    <div className="relative w-full xl:w-96 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar vistoria, rodovia ou ID..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="
                                w-full pl-11 pr-4 py-3 
                                bg-white dark:bg-[#020617] 
                                border border-slate-200 dark:border-white/10 rounded-xl
                                text-sm text-slate-800 dark:text-slate-200 
                                placeholder:text-slate-400 dark:placeholder:text-slate-600
                                focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50
                                transition-all shadow-sm
                            "
                        />
                        {filter && (
                            <button
                                onClick={() => setFilter("")}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    
                    {/* Count */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                       <span className="font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent">{filtered.length}</span>
                       <span>resultados</span>
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-[#020617]/30">
                <AnimatePresence mode="wait">
                    {filtered.length === 0 ? (
                        <motion.div 
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full text-slate-500 py-20"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 opacity-40 dark:opacity-20 text-slate-600 dark:text-white" />
                            </div>
                            <p className="text-lg font-medium text-slate-700 dark:text-slate-400">Nenhum resultado encontrado</p>
                            <p className="text-sm opacity-60">Tente ajustar seus filtros de busca</p>
                            <button 
                                onClick={() => { setFilter(""); setStatusFilter("todos"); }}
                                className="mt-6 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="grid-content"
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-6"
                        >
                            {filtered.slice(0, visibleCount).map((execution, index) => (
                                <ExecutionCard
                                    key={String(execution.id || '') || `execution-${index}`}
                                    execution={execution}
                                    index={index}
                                    isActive={String(execution.id) === activeExecutionId}
                                    onView={() => handleViewDetails(String(execution.id))}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {filtered.length > visibleCount && (
                    <div className="flex justify-center py-6">
                        <button
                            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all border border-slate-200 dark:border-white/10 shadow-sm hover:shadow"
                        >
                            <ChevronDown className="w-4 h-4" />
                            Mostrar mais ({filtered.length - visibleCount} restantes)
                        </button>
                    </div>
                )}
            </div>

            <ExecutionDetailsModal 
                isOpen={isDetailsOpen} 
                onClose={() => setIsDetailsOpen(false)} 
                execution={selectedExecution} 
            />
            
            {isLoadingDetails && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Carregando detalhes...</p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
