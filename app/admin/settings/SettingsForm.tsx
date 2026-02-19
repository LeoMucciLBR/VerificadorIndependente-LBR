"use client";

import { useActionState, useEffect } from "react";
import { motion } from "framer-motion";
import { updateProjectSettings } from "@/app/actions/settings";
import { Save, Upload, AlertCircle, FileImage, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <motion.button 
      type="submit" 
      disabled={pending}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Save className="w-5 h-5" />
          </motion.div>
          Salvando...
        </>
      ) : (
        <>
          <Save className="w-5 h-5" />
          Salvar Alterações
        </>
      )}
    </motion.button>
  );
}

const initialState = {
  message: null,
  success: false
}

export function SettingsForm({ settings }: { settings: any }) {
  const [state, formAction] = useActionState(updateProjectSettings, initialState);

  useEffect(() => {
    if (state?.success) {
      toast.success("Configurações salvas com sucesso!", {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <Section title="Informações Gerais" icon="📋">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup 
              label="Título do Projeto" 
              name="title" 
              defaultValue={settings?.title || "Verificador Independente"} 
              placeholder="Ex: Rodovia BR-101"
              className="md:col-span-2"
            />
            <InputGroup 
              label="Nome da Contratante" 
              name="clientName" 
              defaultValue={settings?.clientName || ""} 
              placeholder="Ex: ANTT / DNIT" 
            />
            <InputGroup 
              label="Trecho / Segmento" 
              name="segmentName" 
              defaultValue={settings?.segmentName || ""} 
              placeholder="Ex: Divisa SC/PR até Florianópolis" 
            />
          </div>
        </Section>

        <Section title="Detalhes do Contrato" icon="📄">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup 
              label="Nº do Contrato" 
              name="contractNumber" 
              defaultValue={settings?.contractNumber || ""} 
              placeholder="Ex: 001/2024" 
            />
            <InputGroup 
              label="Extensão" 
              name="extension" 
              defaultValue={settings?.extension || ""} 
              placeholder="Ex: 840 km" 
            />
          </div>
        </Section>

        <Section title="Período de Vigência" icon="📅">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup 
              type="date"
              label="Data de Início" 
              name="startDate" 
              defaultValue={settings?.startDate ? new Date(settings.startDate).toISOString().split('T')[0] : ""} 
            />
            <InputGroup 
              type="date"
              label="Data de Término" 
              name="endDate" 
              defaultValue={settings?.endDate ? new Date(settings.endDate).toISOString().split('T')[0] : ""} 
            />
          </div>
        </Section>

        <Section title="Personalização Visual" icon="🎨">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              Imagem de Fundo (Hero)
            </label>
            <div className="border-2 border-dashed border-border/20 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 dark:hover:border-primary/30 transition-all bg-gradient-to-br from-zinc-50/50 to-white dark:from-zinc-900/30 dark:to-black/20 group">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all mb-4">
                <Upload className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm text-foreground font-semibold mb-1">Arraste uma imagem ou clique para selecionar</p>
              <p className="text-xs text-foreground/50 mb-6">Recomendado: 1920x1080px (JPG, PNG, WebP)</p>
              <input 
                type="file" 
                name="heroImageFile" 
                accept="image/*"
                className="block w-full max-w-xs text-sm text-foreground/70 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary file:to-primary/80 file:text-white hover:file:from-primary/90 hover:file:to-primary/70 file:shadow-lg file:shadow-primary/25 file:transition-all file:cursor-pointer cursor-pointer"
              />
            </div>
            {settings?.heroImageUrl && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20"
              >
                <FileImage className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-foreground/70 flex-1">
                  Imagem atual: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{settings.heroImageUrl.split('/').pop()}</span>
                </p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </motion.div>
            )}
          </div>
        </Section>
      </motion.div>

      <div className="pt-6 border-t border-border/10 dark:border-white/10 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function Section({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 pb-3 border-b-2 border-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}

function InputGroup({ label, name, defaultValue, placeholder, type = "text", className = "" }: any) {
  return (
    <motion.div 
      whileFocus={{ scale: 1.005 }}
      className={className}
    >
      <label className="block text-sm font-semibold text-foreground/80 mb-2">
        {label}
      </label>
      <input 
        type={type} 
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-zinc-900/50 border-2 border-border/10 dark:border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:border-border/20 dark:hover:border-white/20"
      />
    </motion.div>
  );
}
