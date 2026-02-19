"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PhaseModal } from "./PhaseModal";
import { createPhase, updatePhase, deletePhase, getPhases } from "@/app/actions/phases";
import { Map as MapIcon } from "lucide-react"; // Renamed to MapIcon
import { SettingsPageLayout } from "../shared/SettingsPageLayout";
import { SettingsListItem } from "../shared/SettingsList";
import { Skeleton } from "@/components/ui/skeleton";

interface Phase {
  id: string;
  nome: string;
  dataInicio: string | Date;
  dataFim: string | Date;
  isActive: boolean;
  criadoPor?: {
    name: string | null;
    email: string;
  };
}

export function PhaseList() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPhases();
  }, []);

  const loadPhases = async () => {
    setIsLoading(true);
    const result = await getPhases();
    if (result.success && result.data) {
      setPhases(result.data);
    } else {
      toast.error("Erro ao carregar fases");
    }
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingPhase(null);
    setIsModalOpen(true);
  };

  const handleEdit = (phase: Phase) => {
    setEditingPhase(phase);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;

    if (editingPhase) {
      result = await updatePhase(editingPhase.id, formData);
    } else {
      result = await createPhase(formData);
    }

    if (result.success) {
      toast.success(editingPhase ? "Fase atualizada!" : "Fase criada!");
      setIsModalOpen(false);
      loadPhases();
    } else {
      toast.error(result.error || "Erro ao salvar fase");
    }
    setIsSaving(false);
  };

  // Calculate stats
  const activePhases = phases.filter(p => p.isActive).length;
  // const upcomingPhases = phases.filter(p => new Date(p.dataInicio) > new Date()).length;
  const totalDays = phases.reduce((acc, p) => {
     const start = new Date(p.dataInicio).getTime();
     const end = new Date(p.dataFim).getTime();
     const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
     return acc + (days > 0 ? days : 0);
  }, 0);

  return (
    <>
      <SettingsPageLayout
        title="Fases da Obra"
        description="Gerencie os períodos e etapas de execução do projeto rodoviário, definindo cronogramas e vigências."
        icon={MapIcon}
        onNew={handleCreate}
        stats={[
          { label: "Total de Fases", value: phases.length },
          { label: "Em Andamento", value: activePhases, trend: "Ativas", trendUp: true },
          { label: "Dias Totais", value: totalDays, trend: "Planejados", trendUp: true }
        ]}
      >
        {isLoading ? (
           <div className="p-6 space-y-4">
             {[1,2,3].map(i => (
               <div key={i} className="flex items-center gap-4">
                 <Skeleton className="w-12 h-12 rounded-lg" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-4 w-1/3" />
                   <Skeleton className="h-3 w-1/2" />
                 </div>
               </div>
             ))}
           </div>
        ) : phases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <MapIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhuma fase encontrada</h3>
            <p className="text-slate-500 max-w-sm mb-6">Comece criando a primeira fase do seu projeto para definir o cronograma.</p>
            <button onClick={handleCreate} className="text-blue-600 font-bold hover:underline">
              Criar primeira fase
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {phases.map((phase, index) => {
               const startDate = new Date(phase.dataInicio);
               const endDate = new Date(phase.dataFim);
               const now = new Date();
               let status: any = "active";
               if (!phase.isActive) status = "inactive";
               else if (now < startDate) status = "pending";
               else if (now > endDate) status = "archived";

               const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

               return (
                 <SettingsListItem
                    key={phase.id}
                    index={index}
                    id={phase.id}
                    title={phase.nome}
                    subtitle={`${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`}
                    status={status}
                    icon={MapIcon}
                    onEdit={() => handleEdit(phase)}
                    metadata={[
                      { label: "Duração", value: `${duration} dias` },
                      { label: "Criado Por", value: phase.criadoPor?.name || "Sistema" }
                    ]}
                 />
               );
            })}
          </div>
        )}
      </SettingsPageLayout>

      <PhaseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingPhase}
        isLoading={isSaving}
      />
    </>
  );
}
