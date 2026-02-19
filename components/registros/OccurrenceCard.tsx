"use client";

import React from "react";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
    Calendar, Clock, Eye, MapPin, 
    AlertTriangle, FileText, Camera, ShieldAlert,
    ArrowRight, AlertCircle, CheckCircle2, User, ArrowLeftRight
} from "lucide-react";

interface OccurrenceCardProps {
    registro: any;
    index: number;
    onClick?: () => void;
}

function OccurrenceCard({ registro, index, onClick }: OccurrenceCardProps) {
    const isIndicator = registro.registroReferenteA === "Indicadores_de_desempenho";
    const hasPhoto = registro.ocorrencias_fotos && registro.ocorrencias_fotos.length > 0;

    // Theme Config (Blue Default)
    const theme = {
        startColor: '#3b82f6', // Blue 500
        endColor: '#2563eb',   // Blue 600
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-100 dark:border-blue-500/20',
        text: 'text-blue-700 dark:text-blue-500',
        icon: FileText,
    };

    // 3D Tilt Logic
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

    // Data Extraction
    const rodoviaName = registro.inspecoes?.rodovias?.nome || "Rodovia N/A";
    const segmentName = registro.ocorrencias_trechos?.[0]?.segmentos_homogeneos?.nome || "Segmento N/A";
    const createdBy = registro.users?.name || "Usuário Sistema";
    const lado = registro.lado || "N/A";
    const inspecaoId = registro.inspecoes?.id || "N/A";
    const faseName = registro.inspecoes?.fase?.nome;
    const groupName = registro.grupos?.nome || "Geral";
    
    // Logic to find KM from OcorrenciaTrecho
    const trecho = registro.ocorrencias_trechos?.[0];
    let kmDisplay = "Km N/A";

    if (trecho) {
        const kmIni = trecho.kmInicial;
        const kmFin = trecho.kmFinal;
        
        if (kmIni !== undefined && kmIni !== null) {
            kmDisplay = `Km ${String(kmIni).replace('.', ',')}`;
            if (kmFin !== undefined && kmFin !== null && kmFin !== kmIni) {
                kmDisplay += ` - ${String(kmFin).replace('.', ',')}`;
            }
        }
    } else if (registro.kmInicial) {
         // Fallback if exists on root
         kmDisplay = `Km ${registro.kmInicial}`;
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
                whileHover={{ scale: 1.02 }}
                className={`
                    group relative h-full flex flex-col justify-between
                    bg-white dark:bg-[#0f172a] 
                    border border-slate-200 dark:border-white/5 
                    rounded-2xl cursor-pointer
                    overflow-hidden
                    shadow-sm dark:shadow-md dark:shadow-black/50
                    transition-all duration-150 ease-out
                    hover:shadow-lg hover:shadow-blue-500/10
                `}
                onClick={onClick}
            >
                {/* Mouse Follow Glow */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-soft-light"
                    style={{
                        background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(37, 99, 235, 0.1), transparent 40%)`
                    }}
                />
                
                {/* Top Gradient Line (Animated) */}
                <div className="relative w-full h-1 bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div 
                        className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" 
                        style={{ background: `linear-gradient(90deg, ${theme.startColor}, ${theme.endColor})` }} 
                    />
                </div>

                <div 
                    className="p-6 flex flex-col h-full relative z-10"
                    style={{ transform: "translateZ(30px)" }}
                >
                    {/* Header: Title & Group */}
                    <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="flex items-start gap-3 flex-1">
                            <div className={`
                                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5
                                bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500
                                border border-blue-100 dark:border-blue-500/20
                            `}>
                                {isIndicator ? <ShieldAlert className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                    {faseName || `Execução #${inspecaoId}`}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {isIndicator ? (registro.indicadores?.sigla || "Indicador") : "Anotação de Campo"}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600">•</span>
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                        #{String(registro.id).slice(-4)}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Group Badge (Moved here) */}
                    <div className="mb-3">
                        <div className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                            bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20
                            text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wide
                        `}>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                            <span className="leading-tight">{groupName}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4 min-h-[3rem]">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
                            {registro.anotacoes || registro.indicadores?.nome || "Sem descrição disponível."}
                        </p>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                        
                        {/* Created By */}
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            <span className="truncate">{createdBy}</span>
                        </div>
                         
                         {/* Created At */}
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-violet-500" />
                            <span>{new Date(registro.createdAt || registro.dataHoraOcorrencia).toLocaleDateString()}</span>
                        </div>

                         {/* Side */}
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-orange-500" />
                            <span>Lado: {lado}</span>
                        </div>

                        {/* Km */}
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{kmDisplay}</span>
                        </div>

                    </div>


                    {/* Separator */}
                    <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-4" />

                    {/* Segment & Road Footer */}
                    <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                             <span className="truncate font-medium text-slate-600 dark:text-slate-400 max-w-[60%] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                {segmentName}
                             </span>
                             {hasPhoto && (
                                <div className="flex items-center gap-1 text-blue-500">
                                    <Camera className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">FOTO</span>
                                </div>
                             )}
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}

export default React.memo(OccurrenceCard);
