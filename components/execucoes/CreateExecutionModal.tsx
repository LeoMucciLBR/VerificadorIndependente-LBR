"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { PlusCircle, Loader2, Calendar as CalendarIcon, Map, X, Check } from "lucide-react";
import { createExecution } from "@/app/actions/execucoes";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type CreateExecutionModalProps = {
  fases: any[];
  rodovias: any[];
};

export default function CreateExecutionModal({ fases, rodovias }: CreateExecutionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRodoviaId, setSelectedRodoviaId] = useState<string>("");
  const [paramKey, setParamKey] = useState(0); // Force reset on close
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double clicks

  const selectedRodovia = rodovias.find(r => String(r.id) === selectedRodoviaId);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // We wrap the form action to handle the transition and close modal
  async function onSubmit(formData: FormData) {
      // Prevent double submission
      if (isSubmitting) return;
      setIsSubmitting(true);
      
      try {
        const result = await createExecution(null, formData);
        if (result.success) {
          toast.success("Execução criada!", { description: result.message });
          setIsOpen(false);
          setSelectedRodoviaId("");
          setParamKey(k => k + 1);
        } else {
          toast.error("Erro", { description: result.error });
        }
      } finally {
        setIsSubmitting(false);
      }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/25 transition-all active:scale-95"
      >
        <PlusCircle className="w-4 h-4" />
        <span className="font-medium">Cadastrar Execução</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              key={paramKey}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#1e293b]/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-primary/20 text-blue-600 dark:text-primary ring-1 ring-blue-100 dark:ring-primary/20">
                    <FilePlusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nova Execução</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados da vistoria técnica</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form action={onSubmit} id="create-execution-form" className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Fase */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Fase do Contrato</label>
                        <div className="relative group">
                            <select 
                                name="fase_id" 
                                required
                                className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary appearance-none cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-[#1e293b]/80"
                            >
                                <option value="" disabled selected>Selecione a Fase...</option>
                                {fases.map((fase) => (
                                    <option key={String(fase.id)} value={String(fase.id)}>{fase.nome}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none group-hover:text-blue-500 dark:group-hover:text-primary transition-colors" />
                        </div>
                    </div>

                    {/* Rodovia */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Rodovia</label>
                        <div className="relative group">
                            <select 
                                name="rodovia_id" 
                                onChange={(e) => setSelectedRodoviaId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary appearance-none cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-[#1e293b]/80"
                            >
                                <option value="">Traçado Completo (Todas as Rodovias)</option>
                                {rodovias.map((rod) => (
                                    <option key={String(rod.id)} value={String(rod.id)}>{rod.nome}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none group-hover:text-blue-500 dark:group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                  </div>

                  {/* Geolocalizacao */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                        <Map className="w-3.5 h-3.5 text-blue-500 dark:text-primary" />
                        Escopo Geográfico
                    </label>
                    <div className="relative group">
                        <select 
                            name="segmento_homogeneo_id"
                            disabled={!selectedRodoviaId}
                            className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:enabled:bg-slate-100 dark:hover:enabled:bg-[#1e293b]/80"
                        >
                            <option value="">Segmento Completo (Toda a Rodovia)</option>
                            {selectedRodovia?.segmentos_homogeneos?.map((seg: any) => (
                                <option key={String(seg.id)} value={String(seg.id)}>
                                    {seg.nome} (Km {Number(seg.kmInicial).toFixed(1)} - {Number(seg.kmFinal).toFixed(1)})
                                </option>
                            ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none group-hover:text-blue-500 dark:group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Início</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="date" 
                                name="data_inicio" 
                                required 
                                className="w-full pl-9 bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 md:py-2 outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary transition-all color-scheme-light dark:color-scheme-dark" 
                            />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Término</label>
                         <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="date" 
                                name="data_fim" 
                                required 
                                className="w-full pl-9 bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 md:py-2 outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary transition-all color-scheme-light dark:color-scheme-dark" 
                            />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Mês Ref.</label>
                        <input 
                            type="month" 
                            name="periodo_referencia" 
                            required 
                            className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 md:py-2 outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary transition-all color-scheme-light dark:color-scheme-dark" 
                        />
                     </div>
                  </div>

                  {/* Descricao */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Descrição Detalhada</label>
                    <textarea 
                        name="descricao" 
                        placeholder="Descreva o escopo, condições ou observações relevantes..." 
                        className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3 outline-none focus:border-blue-500 dark:focus:border-primary focus:ring-1 focus:ring-blue-500 dark:focus:ring-primary min-h-[100px] resize-y transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                        required
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-primary/5 rounded-lg border border-blue-100 dark:border-primary/10">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            id="is_official" 
                            name="is_official" 
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1e293b] transition-all checked:border-blue-500 dark:checked:border-primary checked:bg-blue-500 dark:checked:bg-primary hover:border-blue-400 dark:hover:border-primary/50"
                        />
                         <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
                    </div>
                    <label htmlFor="is_official" className="flex flex-col cursor-pointer">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Execução Oficial</span>
                        <span className="text-xs text-slate-500">Marque se esta execução deve ser considerada para relatórios finais e medições contratuais.</span>
                    </label>
                  </div>

                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#1e293b]/30 flex justify-end gap-3">
                <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <SubmitButton isSubmitting={isSubmitting} />
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
    const { pending } = useFormStatus();
    const isDisabled = pending || isSubmitting;
    return (
        <button 
            type="submit" 
            form="create-execution-form"
            disabled={isDisabled} 
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
            {isDisabled ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Execução"}
        </button>
    );
}

function FilePlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 12v6"/></svg>
  )
}

function ChevronDownIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    )
}
