"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Calendar, Trophy, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardCards, createDashboardCard, updateDashboardCard, deleteDashboardCard } from "@/app/actions/dashboard-cards";
import { getPhases } from "@/app/actions/phases";
import { toast } from "sonner";
import { DashboardCardModal } from "./DashboardCardModal";

interface DashboardCard {
  id: string;
  period: string;
  dateLabel: string;
  score: number;
  sortOrder: number;
  faseId?: string | null;
  fase?: { id: string; nome: string } | null;
}

interface Phase {
  id: string;
  nome: string;
}

export function DashboardCardsList() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<DashboardCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [cardsResult, phasesResult] = await Promise.all([
      getDashboardCards(),
      getPhases()
    ]);

    if (cardsResult.success && cardsResult.data) {
      setCards(cardsResult.data as DashboardCard[]);
    }

    if (phasesResult.success && phasesResult.data) {
      setPhases(phasesResult.data as Phase[]);
    }
    
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const handleEdit = (card: DashboardCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este card?")) return;
    const result = await deleteDashboardCard(id);
    if (result.success) {
      toast.success("Card excluído com sucesso");
      loadData();
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    
    if (editingCard) {
      result = await updateDashboardCard(editingCard.id, formData);
    } else {
      result = await createDashboardCard(formData);
    }

    if (result.success) {
      toast.success(editingCard ? "Card atualizado!" : "Card criado!");
      setIsModalOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Erro ao salvar card");
    }
    setIsSaving(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500 bg-emerald-500/10";
    if (score >= 5) return "text-amber-500 bg-amber-500/10";
    return "text-red-500 bg-red-500/10";
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Calendar className="w-8 h-8 text-cyan-500" />
            </div>
            Cards do Dashboard
          </h1>
          <p className="text-foreground/60 text-lg max-w-2xl">
            Gerencie os cards exibidos no "Histórico de Execuções" da tela inicial.
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg hover:shadow-cyan-500/25 transition-all gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Card
        </Button>
      </div>

      {/* Content */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-foreground/50 gap-3 border border-border/10 rounded-xl bg-white dark:bg-white/5">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Carregando cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-foreground/50 gap-3 border border-border/10 rounded-xl bg-white dark:bg-white/5">
            <Calendar className="w-12 h-12 opacity-20" />
            <p>Nenhum card cadastrado.</p>
            <Button variant="outline" onClick={handleCreate}>Criar agora</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 rounded-xl p-5 shadow-sm hover:border-cyan-500/30 transition-all group relative"
                >
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(card)} className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(card.id)} className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{card.period}</h3>
                      <p className="text-xs text-foreground/50">{card.dateLabel}</p>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-2xl mb-3 ${getScoreColor(card.score)}`}>
                    {card.score.toFixed(1)}
                  </div>

                  {card.fase && (
                    <div className="text-xs text-foreground/60 bg-foreground/5 px-2 py-1 rounded">
                      Fase: <span className="font-medium">{card.fase.nome}</span>
                    </div>
                  )}
                  
                  <div className="absolute top-3 left-3 text-xs text-foreground/30 font-mono">
                    #{card.sortOrder}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <DashboardCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingCard}
        phases={phases}
        isLoading={isSaving}
      />
    </div>
  );
}
