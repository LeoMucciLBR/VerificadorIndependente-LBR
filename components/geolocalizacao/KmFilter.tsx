"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KmFilterProps {
  onFilter: (kmInicial: number | null, kmFinal: number | null) => void;
  isLoading?: boolean;
  theme?: 'dark' | 'light';
}

export default function KmFilter({ onFilter, isLoading = false, theme = 'dark' }: KmFilterProps) {
  const [kmInicial, setKmInicial] = useState<string>("");
  const [kmFinal, setKmFinal] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const validateAndFilter = () => {
    setError(null);

    // Se ambos estão vazios, limpar filtro
    if (!kmInicial && !kmFinal) {
      onFilter(null, null);
      return;
    }

    // Validar que ambos foram preenchidos
    if (!kmInicial || !kmFinal) {
      setError("Preencha ambos os campos");
      return;
    }

    const kmIni = parseFloat(kmInicial);
    const kmFim = parseFloat(kmFinal);

    // Validar números válidos
    if (isNaN(kmIni) || isNaN(kmFim)) {
      setError("Valores inválidos");
      return;
    }

    // Validar que km inicial < km final
    if (kmFim <= kmIni) {
      setError("KM final deve ser maior que inicial");
      return;
    }

    // Validar valores positivos
    if (kmIni < 0 || kmFim < 0) {
      setError("Valores devem ser positivos");
      return;
    }

    // Aplicar filtro
    onFilter(kmIni, kmFim);
  };

  const handleClear = () => {
    setKmInicial("");
    setKmFinal("");
    setError(null);
    onFilter(null, null);
  };

  const hasFilter = kmInicial || kmFinal;
  const isDark = theme === 'dark';

  // Classes dinâmicas baseadas no tema
  const labelClasses = isDark ? "text-white/80" : "text-blue-900";
  const subLabelClasses = isDark ? "text-white/40" : "text-blue-900/50";
  const inputClasses = isDark 
      ? "bg-black/20 border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-black/40"
      : "bg-white border-blue-200 text-blue-900 placeholder-blue-300 focus:border-blue-500 focus:bg-blue-50 focus:ring-1 focus:ring-blue-500/20";
  const buttonPrimaryClasses = "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20";
  const buttonSecondaryClasses = isDark
      ? "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
      : "border-blue-200 bg-white text-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-blue-500" />
        <label className={`text-xs font-semibold uppercase tracking-wider ${labelClasses}`}>
          Filtro de Faixa (KM)
        </label>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-[10px] uppercase font-bold mb-1.5 block tracking-widest ${subLabelClasses}`}>
                KM Inicial
              </label>
              <div className="relative group">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={kmInicial}
                    onChange={(e) => {
                      setKmInicial(e.target.value);
                      setError(null);
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-all font-mono ${inputClasses}`}
                    disabled={isLoading}
                  />
              </div>
            </div>

            <div>
              <label className={`text-[10px] uppercase font-bold mb-1.5 block tracking-widest ${subLabelClasses}`}>
                KM Final
              </label>
              <div className="relative group">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={kmFinal}
                    onChange={(e) => {
                      setKmFinal(e.target.value);
                      setError(null);
                    }}
                    placeholder="0.000"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-all font-mono ${inputClasses}`}
                    disabled={isLoading}
                  />
              </div>
            </div>
        </div>

        {error && (
          <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            onClick={validateAndFilter}
            disabled={isLoading}
            className={`flex-1 gap-2 border-0 ${buttonPrimaryClasses}`}
            size="sm"
          >
            <Filter className="w-3.5 h-3.5" />
            {isLoading ? "Processando..." : "Aplicar Filtro"}
          </Button>

          {hasFilter && (
            <Button
              onClick={handleClear}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className={`gap-2 ${buttonSecondaryClasses}`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
