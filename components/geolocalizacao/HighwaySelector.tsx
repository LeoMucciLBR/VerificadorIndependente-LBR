"use client";

import { useState, useEffect } from "react";
import { Map as MapIcon } from "lucide-react";

interface Rodovia {
  id: string;
  uuid: string;
  nome: string;
  codigo: string | null;
  concessionaria: string | null;
}

interface HighwaySelectorProps {
  selectedRodovia: string | null;
  onSelect: (rodoviaUuid: string) => void;
  theme?: 'dark' | 'light';
}

export default function HighwaySelector({
  selectedRodovia,
  onSelect,
  theme = 'dark',
}: HighwaySelectorProps) {
  // ... existing state ... 
  const [rodovias, setRodovias] = useState<Rodovia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRodovias();
  }, []);

  const loadRodovias = async () => {
      // ... loadRodovias implementation (kept same) ...
      try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/geolocalizacao/rodovias");
      if (!response.ok) {
        throw new Error("Erro ao carregar rodovias");
      }

      const data = await response.json();
      setRodovias(data.rodovias || []);

      // Auto-selecionar primeira rodovia se nenhuma estiver selecionada
      if (!selectedRodovia && data.rodovias.length > 0) {
        onSelect(data.rodovias[0].uuid);
      }
    } catch (err) {
      console.error("Error loading rodovias:", err);
      setError("Erro ao carregar rodovias");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`text-sm py-4 text-center ${isDark ? 'text-white/60' : 'text-blue-900/60'}`}>
        Carregando rodovias...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-4 text-center">{error}</div>
    );
  }

  if (rodovias.length === 0) {
    return (
      <div className={`text-sm py-4 text-center ${isDark ? 'text-white/60' : 'text-blue-900/60'}`}>
        Nenhuma rodovia cadastrada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rodovias.map((rodovia) => {
        const isSelected = rodovia.uuid === selectedRodovia;

        // Dynamic classes based on Theme and Selection
        let containerClasses = "";
        let textTitleClasses = "";
        let textSubClasses = "";
        let iconContainerClasses = "";

        if (isDark) {
            // Dark Mode Styles
            containerClasses = isSelected
                ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
                : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20";
            
            textTitleClasses = isSelected ? "text-white" : "text-white/70 group-hover:text-white";
            textSubClasses = "text-white/40";
            
            iconContainerClasses = isSelected 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/5 text-white/40 group-hover:text-white/80';
        } else {
            // Light Mode Styles (Blue Primary)
            containerClasses = isSelected
                ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-200"
                : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300";

            textTitleClasses = isSelected ? "text-blue-900" : "text-slate-700 group-hover:text-blue-800";
            textSubClasses = isSelected ? "text-blue-700/70" : "text-slate-500";

            iconContainerClasses = isSelected
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-200 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50';
        }

        return (
          <button
            key={rodovia.uuid}
            onClick={() => onSelect(rodovia.uuid)}
            className={`group w-full text-left p-3 rounded-lg border transition-all duration-300 relative overflow-hidden ${containerClasses}`}
          >
            {/* Active Indicator Strip */}
            {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            )}

            <div className="flex items-center gap-3 relative z-10">
              <div className={`p-1.5 rounded-md transition-colors ${iconContainerClasses}`}>
                <MapIcon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm truncate transition-colors ${textTitleClasses}`}
                >
                  {rodovia.nome}
                </p>
                {rodovia.concessionaria && (
                  <p className={`text-[10px] mt-0.5 truncate font-mono uppercase tracking-wide ${textSubClasses}`}>
                    {rodovia.concessionaria}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
