"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { X, MapPin, Camera } from "lucide-react";
import OccurrenceDetailsContent from "../registros/OccurrenceDetailsContent";

interface InspecaoOccurrencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    ocorrencias: any[];
    rodovia?: any;
}

export default function InspecaoOccurrencesModal({ isOpen, onClose, ocorrencias = [], rodovia }: InspecaoOccurrencesModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
    useOnClickOutside(ref, () => setSelectedId(null));

    // Handle Escape key
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (selectedId) {
                    setSelectedId(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedId, onClose]);

    // Prevent body scroll (only when open)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const validOccurrences = ocorrencias;
    const selectedItem = validOccurrences.find(o => String(o.id) === selectedId);

    if (!isOpen && !selectedId) {
       // We need to keep it mounted for exit animation if AnimatePresence is used upstream?
       // But here we use Portal.
       // The AnimatePresence is INSIDE the component return if it renders component conditionally?
       // No, usually parent renders component conditionally OR component renders Portal conditionally.
       // Here we render Portal conditionally inside AnimatePresence?
       // Let's use the pattern: Component is always rendered, logic inside.
       // But wait, user calls it like `<InspecaoOccurrencesModal isOpen={...} />`.
       // So we return Portal always? No, only valid DOM.
    }

    // Pattern: 
    // Return Portal containing AnimatePresence.
    
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    
                    {/* Modal Backdrop */}
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                        onClick={onClose}
                    />


                    {/* Modal Container */}
                    <motion.div
                        key="modal-container"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-[95vw] h-[90vh] max-w-7xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
                    >
                        <LayoutGroup>
                            <div className="flex flex-col h-full relative">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0 bg-[#0f172a] z-10">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-white text-xl font-bold tracking-tight">Ocorrências Identificadas</h2>
                                        <div className="bg-white/10 rounded-full px-3 py-1 text-xs font-mono text-white/70 border border-white/5">
                                            {validOccurrences.length} registros
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Main Content Scroll Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                                        {validOccurrences.map((oc: any, i: number) => (
                                            <Card
                                                key={`occ-${oc.id != null ? String(oc.id) : i}-${i}`}
                                                data={oc}
                                                rodovia={rodovia}
                                                isSelected={selectedId === String(oc.id)}
                                                onClick={() => setSelectedId(String(oc.id))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </LayoutGroup>
                    </motion.div>

                    {/* Expanded Item Overlay (Top Level) */}
                    <AnimatePresence>
                        {selectedId && selectedItem && (
                            <motion.div
                                key="expanded-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
                            >
                                    {/* Close Overlay Click Area */}
                                <div 
                                    className="absolute inset-0" 
                                    onClick={() => setSelectedId(null)} 
                                />
                                
                                {/* Expanded Card - Using Shared Content Component */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                                    className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col pointer-events-auto"
                                    ref={ref}
                                >
                                    <OccurrenceDetailsContent 
                                        registro={{ ...selectedItem, rodovia: rodovia || selectedItem.rodovia }} 
                                        onClose={() => setSelectedId(null)}
                                        imageLayoutId={`image-container-${selectedId}`}
                                        className="flex-1 min-h-0"
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function Card({ data, onClick, isSelected, rodovia }: { data: any, onClick: () => void, isSelected?: boolean, rodovia?: any }) {
    const photoUrl = data.ocorrencias_fotos?.[0]?.caminhoArquivo || data.foto_caminho;
    
    return (
        <motion.div
            onClick={onClick}
            className={`w-full bg-slate-800 rounded-xl overflow-hidden border border-white/10 cursor-pointer shadow-lg group hover:border-white/30 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col h-full ${isSelected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Image */}
            <motion.div 
                layoutId={`image-container-${data.id}`}
                className="w-full aspect-[16/9] bg-slate-900 relative overflow-hidden shrink-0 z-10"
            >
                {photoUrl ? (
                    <img 
                        src={photoUrl} 
                        alt="" 
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white/20" />
                    </div>
                )}
                
                {/* Status Badge Overlay */}
                <div className="absolute top-2 right-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border backdrop-blur-md shadow-sm ${
                        data.status === 'CORRIGIDA' 
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                    }`}>
                        {data.status || 'ABERTA'}
                    </span>
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
            </motion.div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 relative">
                <div className="flex items-center gap-2 mb-2">
                     <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {new Date(data.dataHoraOcorrencia).toLocaleDateString('pt-BR')}
                    </span>
                    {data.lado && (
                        <span className="text-[10px] text-slate-500 uppercase font-bold px-1.5 py-0.5 border border-white/5 rounded">
                            {data.lado}
                        </span>
                    )}
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2 mb-2">
                    {data.descricao || data.indicadores?.nome || "Ocorrência Identificada"}
                </h3>
                
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{rodovia?.nome || data.rodovia?.nome || "Rodovia"}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-white font-mono bg-white/10 px-1.5 rounded">Km {data.km}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
