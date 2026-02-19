"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => void;
  initialData?: any;
  phases: { id: string; nome: string }[];
  isLoading?: boolean;
}

export function DashboardCardModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  phases,
  isLoading = false 
}: DashboardCardModalProps) {
  const [formData, setFormData] = useState({
    period: initialData?.period || "",
    date: initialData?.date || "",
    score: initialData?.score?.toString() || "",
    faseId: initialData?.faseId || "",
    order: initialData?.order?.toString() || "0"
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        period: initialData.period || "",
        date: initialData.date || "",
        score: initialData.score?.toString() || "",
        faseId: initialData.faseId || "",
        order: initialData.order?.toString() || "0"
      });
    } else {
      setFormData({
        period: "",
        date: "",
        score: "",
        faseId: "",
        order: "0"
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("period", formData.period);
    data.append("date", formData.date);
    data.append("score", formData.score);
    data.append("faseId", formData.faseId);
    data.append("order", formData.order);
    onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-border/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {initialData ? "Editar Card" : "Novo Card do Dashboard"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Period */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Período *
              </label>
              <input
                type="text"
                required
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="Ex: 1º Trimestre 2024"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-border/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Data (Abreviada) *
              </label>
              <input
                type="text"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="Ex: Mar/2024"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-border/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              />
            </div>

            {/* Score */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Pontuação (0-10) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                placeholder="8.5"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-border/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              />
              <p className="text-xs text-foreground/40 mt-1">
                ≥8: Verde | 5-7.9: Amarelo | &lt;5: Vermelho
              </p>
            </div>

            {/* Phase */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Fase (Opcional)
              </label>
              <select
                value={formData.faseId}
                onChange={(e) => setFormData({ ...formData, faseId: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-border/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              >
                <option value="">Nenhuma</option>
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.nome}</option>
                ))}
              </select>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-border/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              />
              <p className="text-xs text-foreground/40 mt-1">
                Cards são ordenados do menor para o maior
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
