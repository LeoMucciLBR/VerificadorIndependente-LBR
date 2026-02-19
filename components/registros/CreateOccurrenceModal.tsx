"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { 
    Plus, X, Loader2, Calendar, MapPin, AlertCircle, 
    FolderOpen, Route, Milestone, ArrowLeftRight, Rows, FileText,
    Ruler, CheckCircle2, LayoutGrid, Camera, ImageIcon, Trash2
} from "lucide-react";
import { Select } from "./Select";
import { motion, AnimatePresence } from "framer-motion";
import { createOcorrencia, getGruposForSelect, getSegmentosForSelect } from "@/app/actions/ocorrencias";
import { toast } from "sonner";

type CreateOccurrenceModalProps = {
    activeInspection: any;
    indicadores: any[];
    projectSlug: string;
};

export default function CreateOccurrenceModal({ activeInspection, indicadores, projectSlug }: CreateOccurrenceModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [grupos, setGrupos] = useState<any[]>([]);
    const [segmentos, setSegmentos] = useState<any[]>([]);
    const [selectedGrupo, setSelectedGrupo] = useState("");
    const [selectedIndicador, setSelectedIndicador] = useState("");
    const [selectedSegmento, setSelectedSegmento] = useState("");
    const [selectedLado, setSelectedLado] = useState("ambos");
    const [selectedPista, setSelectedPista] = useState("FT01");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Estados para KM com validação
    const [kmInicial, setKmInicial] = useState("");
    const [kmFinal, setKmFinal] = useState("");
    
    // Estado para fotos
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    // Obter limites do segmento selecionado
    const selectedSegData = segmentos.find(s => s.id.toString() === selectedSegmento);
    const segMinKm = selectedSegData ? parseFloat(selectedSegData.kmInicial) : 0;
    const segMaxKm = selectedSegData ? parseFloat(selectedSegData.kmFinal) : 999;
    
    // Validação dos KMs
    const kmInicialNum = parseFloat(kmInicial);
    const kmFinalNum = parseFloat(kmFinal);
    const isKmInicialInvalid = kmInicial !== "" && selectedSegData && (kmInicialNum < segMinKm || kmInicialNum > segMaxKm);
    const isKmFinalInvalid = kmFinal !== "" && selectedSegData && (kmFinalNum < segMinKm || kmFinalNum > segMaxKm);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            // Pass projectSlug to filter segments by project's rodovias
            Promise.all([
                getGruposForSelect(),
                getSegmentosForSelect(projectSlug)
            ]).then(([gruposRes, segmentosRes]) => {
                if (gruposRes.success) setGrupos(gruposRes.data || []);
                if (segmentosRes.success) setSegmentos(segmentosRes.data || []);
            }).finally(() => setLoading(false));
        }
    }, [isOpen, projectSlug]);

    const filteredIndicadores = selectedGrupo 
        ? indicadores.filter(ind => ind.grupo_id?.toString() === selectedGrupo)
        : indicadores;

    async function onSubmit(formData: FormData) {
        if (!activeInspection) {
            toast.error("Erro", { description: "Nenhuma inspeção ativa encontrada." });
            return;
        }
        
        // Append all photos from state to FormData
        // The native file input loses files when processed by JS, so we need to manually add them
        formData.delete('photos'); // Remove any stale entries
        photos.forEach((photo, index) => {
            formData.append('photos', photo);
        });
        
        
        const result = await createOcorrencia(null, formData);
                if (result.success) {
            toast.success("Registro adicionado!", { description: result.message });
            setIsOpen(false);
            setSelectedGrupo("");
            setSelectedIndicador("");
            setSelectedSegmento("");
            setKmInicial("");
            setKmFinal("");
            setSelectedLado("ambos");
            setSelectedPista("FT01");
            setSelectedStatus("");
            setPhotos([]);
            setPhotoPreviews([]);
        } else {
            toast.error("Erro", { description: result.error });
        }
    }

    // Styles
    const sectionBox = "bg-[#0F172A]/50 border border-white/[0.06] rounded-2xl p-4 md:p-5 space-y-4 hover:border-white/10 transition-colors";
    const labelStyle = "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5";
    const inputWrapper = "relative group z-20"; // Adicionado z-index para dropdowns não ficarem escondidos
    const inputStyle = "w-full bg-[#1E293B]/70 hover:bg-[#1E293B] text-slate-200 text-sm border border-transparent hover:border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600 appearance-none cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                disabled={!activeInspection}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_24px_-6px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:scale-95"
            >
                <Plus className="w-5 h-5" />
                <span>Novo Registro</span>
            </button>

            <AnimatePresence>
                {isOpen && activeInspection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-[#0B1121] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] ring-1 ring-white/5"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-gradient-to-r from-blue-900/10 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/5">
                                        <Plus className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">Nova Ocorrência</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <p className="text-xs font-medium text-slate-400">{activeInspection.label}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all hover:rotate-90"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form action={onSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <input type="hidden" name="inspecao_id" value={activeInspection.id} />

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column: Classification & Description */}
                                    <div className="space-y-6">
                                        
                                        {/* Classification */}
                                        <div className={sectionBox}>
                                            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                                                <LayoutGrid className="w-4 h-4 text-blue-400" />
                                                <h3 className="text-sm font-bold text-white">Classificação</h3>
                                            </div>
                                            
                                            <div className="grid gap-5">
                                                <div className={inputWrapper}>
                                                    <label className={labelStyle}><FolderOpen className="w-3.5 h-3.5" /> Grupo</label>
                                                    <Select
                                                        name="grupo_id"
                                                        value={selectedGrupo}
                                                        onChange={(val) => {
                                                            setSelectedGrupo(val.toString());
                                                            setSelectedIndicador(""); // Resetar indicador ao mudar grupo
                                                        }}
                                                        options={grupos.map(g => ({ 
                                                            id: g.id, 
                                                            value: g.id, 
                                                            label: g.nome, 
                                                            subLabel: g.sigla 
                                                        }))}
                                                        placeholder="Selecione o grupo principal..."
                                                        searchable
                                                        className="z-50"
                                                    />
                                                </div>

                                                <div className={inputWrapper}>
                                                    <label className={labelStyle}><AlertCircle className="w-3.5 h-3.5" /> Indicador</label>
                                                    <Select
                                                        name="indicador_id"
                                                        value={selectedIndicador}
                                                        onChange={(val) => setSelectedIndicador(val.toString())}
                                                        options={filteredIndicadores.map(ind => ({ 
                                                            id: ind.id, 
                                                            value: ind.id, 
                                                            label: ind.nome, 
                                                            subLabel: ind.sigla 
                                                        }))}
                                                        placeholder="Selecione o tipo de problema..."
                                                        searchable
                                                        disabled={!selectedGrupo}
                                                        className="z-40"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description & Date */}
                                        <div className={sectionBox}>
                                            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                                                <FileText className="w-4 h-4 text-purple-400" />
                                                <h3 className="text-sm font-bold text-white">Detalhes & Data</h3>
                                            </div>

                                            <div className="grid gap-5">
                                                <div className={inputWrapper}>
                                                    <label className={labelStyle}><Calendar className="w-3.5 h-3.5" /> Data e Hora</label>
                                                    <input 
                                                        type="datetime-local" 
                                                        name="data_hora" 
                                                        required 
                                                        defaultValue={(() => {
                                                            const now = new Date();
                                                            const offset = now.getTimezoneOffset();
                                                            const localDate = new Date(now.getTime() - offset * 60 * 1000);
                                                            return localDate.toISOString().slice(0, 16);
                                                        })()}
                                                        className={`${inputStyle} color-scheme-dark`}
                                                    />
                                                </div>

                                                <div className={inputWrapper}>
                                                    <label className={labelStyle}><FileText className="w-3.5 h-3.5" /> Descrição da Ocorrência</label>
                                                    <textarea 
                                                        name="descricao" 
                                                        required
                                                        placeholder="Descreva o que foi encontrado com mais detalhes..."
                                                        rows={3}
                                                        className={`${inputStyle} resize-none min-h-[100px] leading-relaxed`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Location & Tech Data */}
                                    <div className="space-y-6">
                                        
                                        {/* Location */}
                                        <div className={sectionBox}>
                                            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                                                <MapPin className="w-4 h-4 text-emerald-400" />
                                                <h3 className="text-sm font-bold text-white">Localização</h3>
                                            </div>

                                            <div className="grid gap-5">
                                                <div className={inputWrapper}>
                                                    <label className={labelStyle}><Route className="w-3.5 h-3.5" /> Segmento</label>
                                                    <Select
                                                        name="segmento_id"
                                                        value={selectedSegmento}
                                                        onChange={(val) => setSelectedSegmento(val.toString())}
                                                        options={[...segmentos]
                                                            .sort((a, b) => {
                                                                const numA = parseInt(a.nome.match(/\d+/)?.[0] || '0');
                                                                const numB = parseInt(b.nome.match(/\d+/)?.[0] || '0');
                                                                return numA - numB;
                                                            })
                                                            .map(seg => ({ 
                                                                id: seg.id, 
                                                                value: seg.id, 
                                                                label: seg.nome,
                                                                subLabel: `KM ${parseFloat(seg.kmInicial).toFixed(1)} - ${parseFloat(seg.kmFinal).toFixed(1)}`
                                                            }))}
                                                        placeholder="Selecione o segmento..."
                                                        searchable
                                                        className="z-30"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelStyle}>
                                                            <Milestone className="w-3.5 h-3.5" /> KM Inicial
                                                            {selectedSegData && (
                                                                <span className="text-[9px] text-slate-500 ml-1 font-normal normal-case">
                                                                    (mín: {segMinKm.toFixed(1)})
                                                                </span>
                                                            )}
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            name="km_inicial" 
                                                            step="0.001" 
                                                            value={kmInicial}
                                                            onChange={(e) => setKmInicial(e.target.value)}
                                                            placeholder={selectedSegData ? segMinKm.toFixed(3) : "0.000"}
                                                            className={`${inputStyle} ${isKmInicialInvalid ? '!border-red-500 !ring-red-500/20 !bg-red-500/10' : ''}`} 
                                                            required
                                                        />
                                                        {isKmInicialInvalid && (
                                                            <div className="flex items-center gap-1 mt-1.5 text-red-400 text-[10px] font-medium">
                                                                <AlertCircle className="w-3 h-3" />
                                                                KM inválido! Deve estar entre {segMinKm.toFixed(1)} e {segMaxKm.toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className={labelStyle}>
                                                            <Milestone className="w-3.5 h-3.5" /> KM Final
                                                            {selectedSegData && (
                                                                <span className="text-[9px] text-slate-500 ml-1 font-normal normal-case">
                                                                    (máx: {segMaxKm.toFixed(1)})
                                                                </span>
                                                            )}
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            name="km_final" 
                                                            step="0.001" 
                                                            value={kmFinal}
                                                            onChange={(e) => setKmFinal(e.target.value)}
                                                            placeholder={selectedSegData ? segMaxKm.toFixed(3) : "---"}
                                                            className={`${inputStyle} ${isKmFinalInvalid ? '!border-red-500 !ring-red-500/20 !bg-red-500/10' : ''}`} 
                                                        />
                                                        {isKmFinalInvalid && (
                                                            <div className="flex items-center gap-1 mt-1.5 text-red-400 text-[10px] font-medium">
                                                                <AlertCircle className="w-3 h-3" />
                                                                KM inválido! Deve estar entre {segMinKm.toFixed(1)} e {segMaxKm.toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className={inputWrapper + " z-20"}>
                                                        <label className={labelStyle}><ArrowLeftRight className="w-3.5 h-3.5" /> Lado</label>
                                                        <Select
                                                            name="lado"
                                                            value={selectedLado}
                                                            onChange={(val) => setSelectedLado(val.toString())}
                                                            options={[
                                                                { id: "ambos", value: "ambos", label: "Ambos" },
                                                                { id: "direito", value: "direito", label: "Direito" },
                                                                { id: "Esquerdo", value: "Esquerdo", label: "Esquerdo" }
                                                            ]}
                                                            placeholder="Lado"
                                                        />
                                                    </div>
                                                    <div className={inputWrapper + " z-20"}>
                                                        <label className={labelStyle}><Rows className="w-3.5 h-3.5" /> Faixa</label>
                                                        <Select
                                                            name="pista"
                                                            value={selectedPista}
                                                            onChange={(val) => setSelectedPista(val.toString())}
                                                            options={[
                                                                { id: "FT01", value: "FT01", label: "FT01" },
                                                                { id: "FT02", value: "FT02", label: "FT02" },
                                                                { id: "FT01_FT02", value: "FT01_FT02", label: "1 e 2" },
                                                                { id: "AC", value: "AC", label: "AC" }
                                                            ]}
                                                            placeholder="Faixa"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Technical Data */}
                                        <div className={sectionBox}>
                                            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                                                <Ruler className="w-4 h-4 text-orange-400" />
                                                <h3 className="text-sm font-bold text-white">Dados da Medição</h3>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className={labelStyle}>Valor</label>
                                                    <input type="number" name="valor_medido" step="0.001" placeholder="0.00" className={inputStyle} />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Unid.</label>
                                                    <input type="text" name="unidade_medida" placeholder="m/m²" className={inputStyle} />
                                                </div>
                                                <div className={inputWrapper + " z-10"}>
                                                    <label className={labelStyle}>Status</label>
                                                    <Select
                                                        name="dentro_do_limite"
                                                        value={selectedStatus}
                                                        onChange={(val) => setSelectedStatus(val.toString())}
                                                        options={[
                                                            { id: "sim", value: "sim", label: "Conforme", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
                                                            { id: "nao", value: "nao", label: "Ñ Conforme", icon: <AlertCircle className="w-4 h-4 text-rose-500" /> }
                                                        ]}
                                                        placeholder="-"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Full Width: Photo Upload Section */}
                                <div className={`mt-6 ${sectionBox}`}>
                                    <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                                        <Camera className="w-4 h-4 text-pink-400" />
                                        <h3 className="text-sm font-bold text-white">Fotos da Ocorrência</h3>
                                        {photos.length > 0 && (
                                            <span className="ml-auto text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                                                {photos.length} foto(s)
                                            </span>
                                        )}
                                    </div>

                                    {/* Drop Zone */}
                                    <label 
                                        className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-xl cursor-pointer bg-[#1E293B]/30 hover:bg-[#1E293B]/50 transition-all group"
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500', 'bg-blue-500/10'); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500', 'bg-blue-500/10'); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-500/10');
                                            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                                            if (files.length > 0) {
                                                setPhotos(prev => [...prev, ...files]);
                                                files.forEach(file => {
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => setPhotoPreviews(prev => [...prev, e.target?.result as string]);
                                                    reader.readAsDataURL(file);
                                                });
                                            }
                                        }}
                                    >
                                        <input 
                                            type="file" 
                                            name="photos"
                                            multiple 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length > 0) {
                                                    setPhotos(prev => [...prev, ...files]);
                                                    files.forEach(file => {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setPhotoPreviews(prev => [...prev, ev.target?.result as string]);
                                                        reader.readAsDataURL(file);
                                                    });
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                                <ImageIcon className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                                    Clique ou arraste imagens
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">JPG, PNG até 5MB cada</p>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Photo Previews */}
                                    {photoPreviews.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                                            {photoPreviews.map((preview, index) => (
                                                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-900/50">
                                                    <img src={preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPhotos(prev => prev.filter((_, i) => i !== index));
                                                                setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
                                                            }}
                                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transform scale-90 hover:scale-100 transition-all shadow-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-end gap-3 sticky bottom-0 bg-[#0B1121]/95 backdrop-blur -mx-6 px-6 pb-2 -mb-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsOpen(false)}
                                        className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <SubmitButton />
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button 
            type="submit" 
            disabled={pending}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 cursor-pointer min-w-[160px] justify-center tracking-wide hover:-translate-y-0.5 active:scale-95"
        >
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="animate-pulse">SALVANDO...</span>
                </>
            ) : (
                <>
                    <Plus className="w-4 h-4" />
                    SALVAR
                </>
            )}
        </button>
    );
}
