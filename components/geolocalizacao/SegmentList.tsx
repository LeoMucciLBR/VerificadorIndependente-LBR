"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Segment {
  id: string;
  uuid: string;
  nome: string;
  kmInicial: number;
  kmFinal: number;
  inicioTrecho?: string;
  fimTrecho?: string;
  rodovia: {
    id: string;
    nome: string;
    sigla: string;
  };
}

interface SegmentListProps {
  segments: Segment[];
  selectedSegmentId: string | null;
  onSegmentClick: (segment: Segment) => void;
  theme?: "dark" | "light";
}

export default function SegmentList({
  segments,
  selectedSegmentId,
  onSegmentClick,
  theme = "dark",
}: SegmentListProps) {
  const isDark = theme === "dark";

  if (segments.length === 0) {
    return (
      <div
        className={`p-8 text-center rounded-lg border ${
          isDark
            ? "border-slate-800 bg-slate-900/50 text-slate-400"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">
          Nenhum segmento homogêneo cadastrado
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {segments.map((segment, idx) => {
        const isSelected = selectedSegmentId === segment.id;
        const extensao = (segment.kmFinal - segment.kmInicial).toFixed(2);

        return (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSegmentClick(segment)}
            className={`group relative cursor-pointer rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] ${
              isSelected
                ? isDark
                  ? "border-blue-500 bg-blue-950/30 shadow-lg shadow-blue-500/20"
                  : "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10"
                : isDark
                ? "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/70"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
            }`}
          >
            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
            )}

            {/* Header */}
            <div className="mb-3">
              <h3
                className={`text-lg font-bold mb-1 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {segment.nome}
              </h3>
              <Badge
                variant="secondary"
                className={`text-xs ${
                  isDark
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {segment.rodovia.sigla || segment.rodovia.nome}
              </Badge>
            </div>

            {/* KM Range */}
            <div
              className={`flex items-center justify-between mb-3 text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              <div className="flex items-center gap-1 font-mono font-semibold">
                <span>KM {segment.kmInicial.toFixed(1)}</span>
              </div>
              <ArrowRight className="w-4 h-4" />
              <div className="flex items-center gap-1 font-mono font-semibold">
                <span>KM {segment.kmFinal.toFixed(1)}</span>
              </div>
            </div>

            {/* Extension */}
            <div
              className={`text-xs font-medium ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Extensão: <span className="font-bold">{extensao} km</span>
            </div>

            {/* Hover Action */}
            <div
              className={`absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                isSelected ? "opacity-100" : ""
              }`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-wider ${
                  isSelected
                    ? "text-blue-500"
                    : isDark
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {isSelected ? "Selecionado" : "Ver no mapa"}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
