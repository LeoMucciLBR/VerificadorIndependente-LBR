"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, FileText, Filter, LayoutGrid, List as ListIcon,
    AlertTriangle, CheckCircle2, ShieldAlert, AlertCircle,
    MapPin, Calendar, Clock, ChevronRight, Camera, ChevronDown
} from "lucide-react";
import OccurrenceCard from "./OccurrenceCard";
import OccurrenceDetailsModal from "./OccurrenceDetailsModal";
import { Select } from "./Select";

type OccurrenceListProps = {
    registros: any[];
    pagination: any;
};

type ViewMode = 'grid' | 'list';
const ITEMS_PER_PAGE = 20;

export default function OccurrenceList({ registros, pagination }: OccurrenceListProps) {
    const [filter, setFilter] = useState("");
    const [filters, setFilters] = useState({
        date: "",
        group: "",
        execution: "",
        segment: ""
    });
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    // Extrair opções únicas com memoização
    const uniqueGroups = useMemo(() => 
        Array.from(new Set(registros.map(r => r.grupos?.nome).filter(Boolean))).sort()
    , [registros]);
    
    const uniqueExecutions = useMemo(() =>
        Array.from(new Set(registros.map(r => {
            return r.inspecoes?.fase?.nome || (r.inspecoes?.id ? `Execução #${r.inspecoes.id}` : null);
        }).filter(Boolean))).sort()
    , [registros]);

    const uniqueSegments = useMemo(() =>
        Array.from(new Set(registros.flatMap(r => 
            r.ocorrencias_trechos?.map((t: any) => t.segmentos_homogeneos?.nome) || []
        ).filter(Boolean))).sort()
    , [registros]);

    const filtered = useMemo(() => registros.filter(r => {
        const matchesSearch = 
            r.anotacoes?.toLowerCase().includes(filter.toLowerCase()) ||
            r.indicadores?.nome?.toLowerCase().includes(filter.toLowerCase()) ||
            r.uuid?.toLowerCase().includes(filter.toLowerCase()) ||
            (r.id && String(r.id).includes(filter));
            
        const matchesDate = !filters.date || r.dataHoraOcorrencia.startsWith(filters.date);
        const matchesGroup = !filters.group || r.grupos?.nome === filters.group;
        
        const rExecName = r.inspecoes?.fase?.nome || (r.inspecoes?.id ? `Execução #${r.inspecoes.id}` : "");
        const matchesExecution = !filters.execution || rExecName === filters.execution;

        const rSegments = r.ocorrencias_trechos?.map((t: any) => t.segmentos_homogeneos?.nome) || [];
        const matchesSegment = !filters.segment || rSegments.includes(filters.segment);

        return matchesSearch && matchesDate && matchesGroup && matchesExecution && matchesSegment;
    }), [registros, filter, filters]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#0f172a]/50 backdrop-blur-3xl rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-2xl">
            {/* Toolbar */}
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                 <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                     
                    {/* Search */}
                    <div className="relative w-full xl:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar registros..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#1E293B] transition-all shadow-sm"
                        />
                    </div>
                
                    {/* Filters Row */}
                     <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        
                        {/* Date Filter */}
                        <div className="relative group">
                            <input 
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                            />
                        </div>

                        {/* Group Filter */}
                        <div className="w-full sm:w-48">
                            <Select
                                value={filters.group}
                                onChange={(val) => setFilters(prev => ({ ...prev, group: val as string }))}
                                placeholder="Todos Grupos"
                                options={[
                                    { id: 'all', label: 'Todos Grupos', value: '' },
                                    ...uniqueGroups.map(g => ({ id: g as string, label: g as string, value: g as string }))
                                ]}
                            />
                        </div>

                        {/* Execution Filter */}
                        <div className="w-full sm:w-48">
                            <Select
                                value={filters.execution}
                                onChange={(val) => setFilters(prev => ({ ...prev, execution: val as string }))}
                                placeholder="Todas Execuções"
                                options={[
                                    { id: 'all', label: 'Todas Execuções', value: '' },
                                    ...uniqueExecutions.map(e => ({ id: e as string, label: e as string, value: e as string }))
                                ]}
                            />
                        </div>

                         {/* Segment Filter */}
                         <div className="w-full sm:w-48">
                            <Select
                                value={filters.segment}
                                onChange={(val) => setFilters(prev => ({ ...prev, segment: val as string }))}
                                placeholder="Todos Segmentos"
                                options={[
                                    { id: 'all', label: 'Todos Segmentos', value: '' },
                                    ...uniqueSegments.map(s => ({ id: s as string, label: s as string, value: s as string }))
                                ]}
                            />
                        </div>

                         <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden xl:block mx-2" />

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1E293B]/50 rounded-xl border border-slate-200 dark:border-white/5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Grade"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Lista"
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#020617]/30 ${viewMode === 'list' ? 'p-0' : 'p-6'}`}>
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full text-slate-500 py-20"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 opacity-40 dark:opacity-20 text-slate-600 dark:text-white" />
                            </div>
                            <p className="text-lg font-medium text-slate-700 dark:text-slate-400">Nenhum registro encontrado</p>
                        </motion.div>
                    ) : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-6">
                                {filtered.slice(0, visibleCount).map((reg, index) => (
                                     <OccurrenceCard key={String(reg.id)} registro={reg} index={index} onClick={() => setSelectedOccurrence(reg)} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col pb-6">
                                {/* List Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-sm z-10">
                                    <div className="col-span-1 text-center">ID</div>
                                    <div className="col-span-4">Ocorrência</div>
                                    <div className="col-span-3">Localização</div>
                                    <div className="col-span-2">Data e Hora</div>
                                    <div className="col-span-2 text-center">Status</div>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {filtered.slice(0, visibleCount).map((reg, index) => (
                                        <OccurrenceRow key={String(reg.id)} registro={reg} index={index} onClick={() => setSelectedOccurrence(reg)} />
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </AnimatePresence>
                
                {filtered.length > visibleCount && (
                    <div className={`flex justify-center py-6 ${viewMode === 'list' ? 'px-6' : ''}`}>
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
            
            {/* Footer Count */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Mostrando <strong>{Math.min(visibleCount, filtered.length)}</strong> de <strong>{filtered.length}</strong> registros</span>
            </div>

            <OccurrenceDetailsModal 
                isOpen={!!selectedOccurrence} 
                onClose={() => setSelectedOccurrence(null)} 
                registro={selectedOccurrence} 
            />
        </div>
    );
}

// Row component for list view
function OccurrenceRow({ registro, index, onClick }: { registro: any, index: number, onClick: () => void }) {
    const isIndicator = registro.registroReferenteA === "Indicadores_de_desempenho";
    
    const statusConfig = {
        'ABERTA': { pill: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-500/20' },
        'CRITICA': { pill: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/20' },
        'ENCERRADA': { pill: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20' }
    };
    const style = statusConfig[registro.status as keyof typeof statusConfig] || { pill: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };

    const rodoviaName = registro.inspecoes?.rodovias?.nome || "N/A";
    const segmentName = registro.ocorrencias_trechos?.[0]?.segmentos_homogeneos?.nome || "N/A";
    const hasPhoto = registro.ocorrencias_fotos && registro.ocorrencias_fotos.length > 0;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className="group grid grid-cols-12 gap-4 px-6 py-4 items-center bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            onClick={onClick}
        >
            <div className="col-span-1 text-center font-mono text-xs text-slate-500 dark:text-slate-500">
                {String(registro.id).slice(-4)}
            </div>
            
            <div className="col-span-4">
                <div className="flex items-start gap-3">
                     <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isIndicator ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {isIndicator ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">
                                {isIndicator ? registro.indicadores?.sigla : "Anotação"}
                            </span>
                            {hasPhoto && <Camera className="w-3 h-3 text-blue-500" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {registro.anotacoes || registro.indicadores?.nome || "-"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="col-span-3">
                 <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{rodoviaName}</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" /> {segmentName}
                    </div>
                 </div>
            </div>

            <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    {new Date(registro.dataHoraOcorrencia).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    {new Date(registro.dataHoraOcorrencia).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>

            <div className="col-span-2 text-center flex items-center justify-center gap-4">
                 <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${style.pill}`}>
                    {registro.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </motion.div>
    );
}
