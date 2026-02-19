"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, MapPin, Ruler, FileText, Weight, Layers, Info, Hash, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { toast } from "sonner";

interface SegmentoFormValues {
    id_rodovia: string;
    km_inicial: number | null;
    km_final: number | null;
}

interface SegmentoFormProps {
  onSuccess?: () => void;
  onValuesChange?: (values: SegmentoFormValues) => void;
}

export default function SegmentoForm({ onSuccess, onValuesChange }: SegmentoFormProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [formData, setFormData] = useState({
    id_rodovia: "",
    nome: "",
    km_inicial: "",
    km_final: "",
    descricao: "",
    inicioTrecho: "",
    fimTrecho: "",
    areaTotalM2: "",
    faixaAdicionalOuDuplicado: "0",
    peso: "1.0",
    quantMinimaPlacasM2: "",
    totalPlacasM2: ""
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [rodovias, setRodovias] = useState<any[]>([]);
  const [loadingRodovias, setLoadingRodovias] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar Rodovias
  useEffect(() => {
    async function fetchRodovias() {
      try {
        const response = await fetch("/api/geolocalizacao/rodovias");
        if (response.ok) {
          const data = await response.json();
          setRodovias(data.rodovias || []);
        }
      } catch (error) {
        console.error("Erro ao carregar rodovias", error);
        toast.error("Erro ao carregar rodovias");
      } finally {
        setLoadingRodovias(false);
      }
    }
    fetchRodovias();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Atualiza estado local
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        
        // Emite mudanças para o pai (Preview Map)
        if (onValuesChange) {
            // Filtrar apenas se id_rodovia, km_inicial ou km_final mudaram
            if (['id_rodovia', 'km_inicial', 'km_final'].includes(name)) {
                 const idRodovia = name === 'id_rodovia' ? value : newData.id_rodovia;
                 const kmIni = name === 'km_inicial' ? parseFloat(value) : parseFloat(newData.km_inicial);
                 const kmFim = name === 'km_final' ? parseFloat(value) : parseFloat(newData.km_final);
                 
                 onValuesChange({
                     id_rodovia: idRodovia,
                     km_inicial: isNaN(kmIni) ? null : kmIni,
                     km_final: isNaN(kmFim) ? null : kmFim
                 });
            }
        }
        
        return newData;
    });

    // Limpar erro ao digitar
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const validate = () => {
      const newErrors: {[key: string]: string} = {};
      
      if (!formData.id_rodovia) newErrors.id_rodovia = "Selecione uma rodovia";
      if (!formData.nome.trim()) newErrors.nome = "O nome do segmento é obrigatório";
      
      const kmIni = parseFloat(formData.km_inicial);
      const kmFim = parseFloat(formData.km_final);
      
      if (!formData.km_inicial || isNaN(kmIni) || kmIni < 0) newErrors.km_inicial = "KM inválido";
      if (!formData.km_final || isNaN(kmFim) || kmFim < 0) newErrors.km_final = "KM inválido";
      
      if (kmIni >= 0 && kmFim >= 0 && kmFim <= kmIni) {
          newErrors.km_final = "KM Final deve ser maior que Inicial";
      }

      if (formData.peso && (isNaN(parseFloat(formData.peso)) || parseFloat(formData.peso) < 0)) {
          newErrors.peso = "Peso inválido";
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
        toast.error("Verifique os erros no formulário");
        return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id_rodovia: formData.id_rodovia,
        nome: formData.nome,
        km_inicial: parseFloat(formData.km_inicial),
        km_final: parseFloat(formData.km_final),
        descricao: formData.descricao,
        inicioTrecho: formData.inicioTrecho,
        fimTrecho: formData.fimTrecho,
        areaTotalM2: formData.areaTotalM2 ? parseInt(formData.areaTotalM2) : null,
        faixaAdicionalOuDuplicado: parseInt(formData.faixaAdicionalOuDuplicado),
        peso: parseFloat(formData.peso || "1.0"),
        quantMinimaPlacasM2: formData.quantMinimaPlacasM2 ? parseFloat(formData.quantMinimaPlacasM2) : null,
        totalPlacasM2: formData.totalPlacasM2 ? parseFloat(formData.totalPlacasM2) : null
      };

      const response = await fetch("/api/geolocalizacao/segmentos", { // Note: Ajustar endpoint se necessário
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Falha ao salvar segmento");
      }

      setFormData({
        id_rodovia: "",
        nome: "",
        km_inicial: "",
        km_final: "",
        descricao: "",
        inicioTrecho: "",
        fimTrecho: "",
        areaTotalM2: "",
        faixaAdicionalOuDuplicado: "0",
        peso: "1.0",
        quantMinimaPlacasM2: "",
        totalPlacasM2: ""
      });
      
      if (onSuccess) onSuccess();
      toast.success("Segmento Homogêneo salvo com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar segmento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Styles
  const cardClass = isDark ? "bg-white/5 backdrop-blur-md border-white/10" : "bg-white/80 backdrop-blur-md border-slate-200 shadow-xl";
  const labelClass = `flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`;
  const inputClass = `w-full h-10 px-3 pl-10 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 ${isDark 
    ? "bg-slate-950/50 border-white/10 text-white placeholder-white/20 hover:border-white/20" 
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 hover:border-slate-300"}`;
  const iconClass = `absolute left-3 top-2.5 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`;
  const errorClass = "text-xs text-rose-500 mt-1 font-medium flex items-center gap-1";


  return (
    <div className={`p-8 rounded-2xl border ${cardClass}`}>
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Layers className="w-5 h-5" />
            </div>
            <div>
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Novo Segmento</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Preencha os dados técnicos do trecho homogêneo.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Rodovia & Nome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                  <label className={labelClass}>
                      <MapPin className="w-3.5 h-3.5" /> Rodovia
                  </label>
                  <div className="relative">
                      <select 
                          name="id_rodovia" 
                          value={formData.id_rodovia}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none cursor-pointer`}
                          disabled={loadingRodovias}
                      >
                          <option value="">Selecione...</option>
                          {rodovias.map((fw) => (
                              <option key={fw.uuid} value={fw.uuid}>
                                  {fw.nome} {fw.concessionaria ? `(${fw.concessionaria})` : ""}
                              </option>
                          ))}
                      </select>
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-blue-500 pointer-events-none" />
                  </div>
                  {errors.id_rodovia && <p className={errorClass}><AlertTriangle className="w-3 h-3"/> {errors.id_rodovia}</p>}
              </div>

              <div className="relative group">
                  <label className={labelClass}>
                      <Hash className="w-3.5 h-3.5" /> Nome / Código
                  </label>
                  <div className="relative">
                      <Input 
                          name="nome"
                          placeholder="Ex: SH-01"
                          value={formData.nome}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                      />
                      <Hash className={iconClass} />
                  </div>
                   {errors.nome && <p className={errorClass}><AlertTriangle className="w-3 h-3"/> {errors.nome}</p>}
              </div>
          </div>

          {/* KMs */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 grid grid-cols-2 gap-6 relative overflow-hidden">
             
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

             <div className="relative">
                 <label className={`${labelClass} text-blue-500`}>
                     <Ruler className="w-3.5 h-3.5" /> KM Inicial
                 </label>
                 <div className="relative">
                     <Input 
                        type="number" step="0.001" name="km_inicial"
                        placeholder="0.000"
                        value={formData.km_inicial}
                        onChange={handleChange}
                        className={`${inputClass} !bg-white/5 border-blue-500/20 focus:border-blue-500`}
                     />
                     <div className="absolute left-3 top-2.5 text-xs font-bold text-blue-500/50">KM</div>
                 </div>
                 {errors.km_inicial && <p className={errorClass}>{errors.km_inicial}</p>}
             </div>
             
             <div className="relative">
                 <label className={`${labelClass} text-blue-500`}>
                     <Ruler className="w-3.5 h-3.5" /> KM Final
                 </label>
                 <div className="relative">
                     <Input 
                        type="number" step="0.001" name="km_final"
                        placeholder="0.000"
                        value={formData.km_final}
                        onChange={handleChange}
                        className={`${inputClass} !bg-white/5 border-blue-500/20 focus:border-blue-500`}
                     />
                     <div className="absolute left-3 top-2.5 text-xs font-bold text-blue-500/50">KM</div>
                 </div>
                 {errors.km_final && <p className={errorClass}>{errors.km_final}</p>}
             </div>
          </div>

          {/* Referências de Trecho */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                  <label className={labelClass}>Início do Trecho (Ref.)</label>
                  <div className="relative">
                      <Input 
                          name="inicioTrecho"
                          placeholder="Ex: Trevo de Acesso X"
                          value={formData.inicioTrecho}
                          onChange={handleChange}
                          className={inputClass}
                      />
                      <MapPin className={iconClass} />
                  </div>
              </div>
              <div className="relative">
                  <label className={labelClass}>Fim do Trecho (Ref.)</label>
                  <div className="relative">
                      <Input 
                          name="fimTrecho"
                          placeholder="Ex: Ponte Y"
                          value={formData.fimTrecho}
                          onChange={handleChange}
                          className={inputClass}
                      />
                      <MapPin className={iconClass} />
                  </div>
              </div>
          </div>
          
          {/* Dados Técnicos 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                  <label className={labelClass}>
                      <Weight className="w-3.5 h-3.5" /> Peso
                  </label>
                  <div className="relative">
                      <Input 
                          type="number" step="0.000001"
                          name="peso"
                          placeholder="1.0"
                          value={formData.peso}
                          onChange={handleChange}
                          className={inputClass}
                      />
                      <Weight className={iconClass} />
                  </div>
                  {errors.peso && <p className={errorClass}>{errors.peso}</p>}
              </div>

               <div className="relative">
                  <label className={labelClass}>
                      <Info className="w-3.5 h-3.5" /> Faixa Adicional
                  </label>
                  <div className="relative">
                      <select 
                          name="faixaAdicionalOuDuplicado"
                          value={formData.faixaAdicionalOuDuplicado}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none`}
                      >
                          <option value="0">Não (Pista Simples)</option>
                          <option value="1">Sim (Faixa Adic./Duplicado)</option>
                      </select>
                      <Info className={iconClass} />
                  </div>
              </div>
          </div>

          {/* Dados Técnicos 2 (Placas/Area) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                  <label className={labelClass}>Área Total (m²)</label>
                  <Input 
                      type="number" name="areaTotalM2" placeholder="0"
                      value={formData.areaTotalM2} onChange={handleChange} className={`${inputClass} pl-3`}
                  />
              </div>
              <div className="relative">
                  <label className={labelClass}>Qtd. Mín. Placas m²</label>
                   <Input 
                      type="number" step="0.01" name="quantMinimaPlacasM2" placeholder="0.00"
                      value={formData.quantMinimaPlacasM2} onChange={handleChange} className={`${inputClass} pl-3`}
                  />
              </div>
               <div className="relative">
                  <label className={labelClass}>Total Placas m²</label>
                   <Input 
                      type="number" step="0.01" name="totalPlacasM2" placeholder="0.00"
                      value={formData.totalPlacasM2} onChange={handleChange} className={`${inputClass} pl-3`}
                  />
              </div>
          </div>

          <div className="relative">
                <label className={labelClass}>Descrição Completa</label>
                 <div className="relative">
                     <textarea 
                        name="descricao"
                        rows={3}
                        placeholder="Observações adicionais sobre o segmento..."
                        value={formData.descricao}
                        onChange={handleChange}
                        className={`${inputClass} h-auto py-3`}
                     />
                     <FileText className={iconClass} />
                 </div>
          </div>

          <div className="pt-4">
            <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={isSubmitting}
            >
              {isSubmitting ? (
                  <span className="flex items-center gap-2">
                       <Loader2 className="h-5 w-5 animate-spin" /> Salvando...
                  </span>
              ) : (
                  <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Salvar Segmento
                  </span>
              )}
            </Button>
          </div>
        </form>
    </div>
  );
}
