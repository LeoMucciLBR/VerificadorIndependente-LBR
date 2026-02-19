"use client";

import { 
  FileText, 
  Users, 
  BarChart, 
  BadgeInfo, 
  Sigma, 
  Pin, 
  Variable, 
  Building2,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "phases", label: "Fases", icon: FileText, description: "Etapas de inspeção" },
  { id: "groups", label: "Grupos", icon: Users, description: "Equipes e departamentos" },
  { id: "indicators", label: "Indicadores", icon: BarChart, description: "KPIs e métricas" },
  { id: "characteristics", label: "Caracterizações", icon: BadgeInfo, description: "Atributos técnicos" },
  { id: "formulas", label: "Fórmulas", icon: Sigma, description: "Cálculos e lógica" },
  { id: "constants", label: "Constantes", icon: Pin, description: "Valores fixos" },
  { id: "variables", label: "Variáveis",  icon: Variable, description: "Parâmetros dinâmicos" },
  { id: "dashboards", label: "Dashboard Cards", icon: BarChart, description: "Cards da tela inicial" },
  { id: "institutions", label: "Instituições", icon: Building2, description: "Empresas e órgãos" },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <div className="w-80 bg-gray-50 dark:bg-[#1a2332] h-full flex flex-col border-r border-gray-200 dark:border-white/5 relative z-20">
      {/* Navigation List - Vertically Centered */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-white/20 flex flex-col justify-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative
              ${activeSection === item.id 
                ? "bg-primary/10 dark:bg-white/10 text-primary dark:text-white shadow-lg" 
                : "text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"}
            `}
          >
            {/* Active Indicator Line */}
            {activeSection === item.id && (
              <motion.div 
                layoutId="activeIndicator"
                className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full"
              />
            )}

            {/* Icon Container */}
            <div className={`
              p-2 rounded-lg transition-colors
              ${activeSection === item.id 
                ? "bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                : "bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-white/50 group-hover:bg-gray-300 dark:group-hover:bg-white/10 group-hover:text-gray-900 dark:group-hover:text-white"}
            `}>
              <item.icon className="w-5 h-5" />
            </div>

            {/* Text Content */}
            <div className="flex-1 text-left">
              <span className="block font-medium text-sm">{item.label}</span>
              <span className="block text-[10px] text-gray-500 dark:text-white/30 group-hover:text-gray-700 dark:group-hover:text-white/50 transition-colors">
                {item.description}
              </span>
            </div>
            
            {/* Chevron (re-added for wide layout) */}
            <ChevronRight className={`
              w-4 h-4 transition-all duration-300
              ${activeSection === item.id 
                ? "text-primary opacity-100 translate-x-0" 
                : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"}
            `} />
          </button>
        ))}
      </div>
    </div>
  );
}
