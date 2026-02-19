import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  BarChart3, 
  Download,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getExecutions } from "@/app/actions/execucoes";
import { getRodoviasWithSegments } from "@/app/actions/rodovias";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectSlug?: string;
}

export default function CreateReportModal({ isOpen, onClose, projectSlug: propProjectSlug }: CreateReportModalProps) {
  const params = useParams();
  // Ensure projectSlug is a string and not an array
  const rawProject = params?.project;
  const paramProjectSlug = Array.isArray(rawProject) ? rawProject[0] : rawProject;
  
  // Use prop if available, otherwise fallback to params
  const projectSlug = propProjectSlug || paramProjectSlug;

  const [step, setStep] = useState(1);
  const [reportType, setReportType] = useState("inspecao");
  const [formatType, setFormatType] = useState("pdf");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [isAllTime, setIsAllTime] = useState(false);
  const [inspectionId, setInspectionId] = useState("");
  const [timeScope, setTimeScope] = useState("todo");
  const [segmentScope, setSegmentScope] = useState("todos");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [executions, setExecutions] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          // Fetch Executions
          const execRes = await getExecutions(projectSlug);
          if (execRes.success && Array.isArray(execRes.data)) {
            setExecutions(execRes.data);
          }

          // Fetch Segments (flattened from Rodovias)
          const rodRes = await getRodoviasWithSegments(projectSlug);
          if (rodRes.success && Array.isArray(rodRes.data)) {
            // Flatten segments from all rodovias
            const allSegments = rodRes.data.flatMap((rodovia: any) => 
               rodovia.segmentos_homogeneos?.map((seg: any) => ({
                 ...seg,
                 rodoviaName: rodovia.nome
               })) || []
            );
            setSegments(allSegments);
          }
        } catch (error) {
          console.error("Error fetching report data:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchData();
    }
  }, [isOpen, projectSlug]);

  useEffect(() => {
    setSegmentScope("todos");
    setTimeScope("todo");
  }, [reportType]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
    setIsSuccess(true);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-all duration-300"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden z-50 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                Novo Relatório
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure os detalhes para gerar seu documento inteligente.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">
            {!isSuccess ? (
              <>
                {/* 1. Tipo de Relatório (Grid Selection) */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-200">
                    Tipo de Relatório
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "inspecao", label: "Por Inspeção", icon: FileText, desc: "Detalhes de uma execução específica" },
                      { id: "ocorrencias", label: "Relatório de Ocorrências", icon: BarChart3, desc: "Agrupado por segmento, data ou via" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setReportType(type.id)}
                        className={`relative group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left hover:shadow-md ${
                          reportType === type.id
                            ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            reportType === type.id
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:bg-primary/10"
                          }`}
                        >
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div
                            className={`font-semibold text-sm ${
                              reportType === type.id
                                ? "text-primary"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {type.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {type.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Conditional Fields based on Report Type */}
                  <AnimatePresence mode="wait">
                    {reportType === "inspecao" ? (
                      <motion.div
                        key="inspecao-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                         <div className="space-y-2">
                           <Label className="text-base font-semibold text-slate-900 dark:text-slate-200">
                            Selecione a Inspeção
                          </Label>
                          <Select value={inspectionId} onValueChange={setInspectionId} disabled={isLoadingData}>
                            <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                              <SelectValue placeholder={isLoadingData ? "Carregando..." : "Escolha uma execução..."} />
                            </SelectTrigger>
                            <SelectContent className="z-[10000] max-h-[300px]">
                              {executions.length > 0 ? (
                                executions.map((exec: any) => (
                                  <SelectItem key={exec.id} value={String(exec.id)}>
                                    {exec.descricaoVistoria || `Inspeção #${exec.id}`} - {new Date(exec.dataInicioVistoria).toLocaleDateString()}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>Nenhuma inspeção encontrada</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-base font-semibold text-slate-900 dark:text-slate-200">
                              Período
                            </Label>
                             <Select value={timeScope} onValueChange={setTimeScope}>
                              <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10000]">
                                <SelectItem value="todo">Inspeção Completa</SelectItem>
                                <SelectItem value="periodo">Período Específico</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                           <div className="space-y-2">
                            <Label className="text-base font-semibold text-slate-900 dark:text-slate-200">
                              Segmentos
                            </Label>
                             <Select value={segmentScope} onValueChange={setSegmentScope}>
                              <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10000] max-h-[300px]">
                                <SelectItem value="todos">Todos os Segmentos</SelectItem>
                                {segments.length > 0 && <SelectItem value="selecionar" disabled className="font-semibold opacity-100 bg-slate-50 dark:bg-slate-800">--- Específicos ---</SelectItem>}
                                {segments.map((seg: any) => (
                                  <SelectItem key={seg.id} value={String(seg.id)}>
                                    {seg.rodoviaName} - {seg.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ocorrencias-fields"
                         initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                         <div className="space-y-2">
                            <Label className="text-base font-semibold text-slate-900 dark:text-slate-200">
                              Segmentos
                            </Label>
                            <Select value={segmentScope} onValueChange={setSegmentScope}>
                              <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10000] max-h-[300px]">
                                <SelectItem value="todos">Todos os Segmentos (Via Toda)</SelectItem>
                                {segments.length > 0 && <SelectItem value="selecionar-header" disabled className="font-semibold opacity-100 bg-slate-50 dark:bg-slate-800">--- Segmentos Específicos ---</SelectItem>}
                                {segments.map((seg: any) => (
                                  <SelectItem key={seg.id} value={String(seg.id)}>
                                    {seg.rodoviaName} - {seg.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                         
                         <div className="space-y-2">
                           <Label className="text-base font-semibold text-slate-900 dark:text-slate-200">
                              Período / Data
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                               <div className="col-span-2 sm:col-span-1">
                                  <label className="text-xs text-slate-500 mb-1 block">De:</label>
                                  <Input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={isAllTime}
                                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                                  />
                               </div>
                               <div className="col-span-2 sm:col-span-1">
                                  <label className="text-xs text-slate-500 mb-1 block">Até:</label>
                                  <Input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={isAllTime}
                                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                                  />
                               </div>
                               <div className="col-span-2 flex items-center space-x-2 pt-1">
                                  <input 
                                    type="checkbox" 
                                    id="all-time" 
                                    checked={isAllTime}
                                    onChange={(e) => setIsAllTime(e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary" 
                                  />
                                  <label htmlFor="all-time" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Considerar todas as datas (Vida útil)
                                  </label>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 3. Formato de Saída */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-900 dark:text-slate-200">
                      Formato
                    </Label>
                    <div className="flex gap-3">
                      {[
                        { id: "pdf", label: "PDF", icon: FileText },
                        { id: "xlsx", label: "Excel", icon: FileSpreadsheet },
                      ].map((format) => (
                        <button
                          key={format.id}
                          onClick={() => setFormatType(format.id)}
                          className={`flex-1 flex flex-col items-center justify-center gap-2 h-12 rounded-xl border font-medium text-sm transition-all duration-200 ${
                            formatType === format.id
                              ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <format.icon className="w-4 h-4" />
                            {format.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-500/5"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Relatório Pronto!
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-base">
                    Seu arquivo foi gerado e o download começará em instantes.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex justify-end gap-3 backdrop-blur-sm">
            {!isSuccess ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="px-6 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating} 
                  className="min-w-[160px] h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Gerar Agora
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                onClick={onClose} 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                Concluir
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
