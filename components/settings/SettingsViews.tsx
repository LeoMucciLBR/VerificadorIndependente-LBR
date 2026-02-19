"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Folder, FileText, Users, BarChart, BadgeInfo, Sigma, Pin, Variable, Building2, UserCog, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhaseList } from "./phases/PhaseList";
import { GroupList } from "./groups/GroupList";
import { IndicatorList } from "./indicators/IndicatorList";
import { CaracterizacaoList } from "./caracterizacoes/CaracterizacaoList";
import { ConstantsList } from "./constants/ConstantsList";
import { VariablesList } from "./variables/VariablesList";
import { InstitutionList } from "./institutions/InstitutionList";
import { FormulaList } from "./formulas/FormulaList";
import { RodoviaManager } from "./rodovias/RodoviaManager";
import { UserList } from "./users/UserList";
import { DashboardCardsList } from "./dashboards/DashboardCardsList";
import { ProjectSettingsForm } from "./projects/ProjectSettingsForm";

interface SettingsViewsProps {
  activeSection: string;
}

export function SettingsViews({ activeSection }: SettingsViewsProps) {
  
  const renderContent = () => {
    switch (activeSection) {
      case "rodovias":
        return <RodoviaManager />;
      case "phases":
        return <PhaseList />;
      case "groups":
        return <GroupList />;
      case "indicators":
        return <IndicatorList />;
      case "caracterizacoes":
      case "characteristics":
        return <CaracterizacaoList />;
      case "constants":
        return <ConstantsList />;
      case "variables":
        return <VariablesList />;
      case "institutions":
        return <InstitutionList />;
      case "formulas":
        return <FormulaList />;
      case "dashboards":
        return <DashboardCardsList />;
      case "users":
        return <UserList />;
      default:
        // Generic placeholder for other sections
        const labels: Record<string, string> = {
            phases: "Fases de Inspeção",
            groups: "Grupos e Equipes",
            indicators: "Indicadores de Desempenho",
            characteristics: "Caracterizações Técnicas",
            constants: "Constantes do Sistema",
            variables: "Variáveis de Cálculo",
            institutions: "Instituições e Órgãos"
        };
        const icons: Record<string, any> = {
            phases: FileText,
            groups: Users,
            indicators: BarChart,
            characteristics: BadgeInfo,
            constants: Pin,
            variables: Variable,
            institutions: Building2
        };
        
        return <PlaceholderView 
            title={labels[activeSection] || "Configurações"} 
            icon={icons[activeSection] || Folder} 
            description={`Gerencie as configurações de ${labels[activeSection]?.toLowerCase() || "sistema"} aqui.`}
        />;
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-navy-light/50 h-full overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full p-8 overflow-y-auto"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const PlaceholderView = ({ title, icon: Icon, description }: { title: string, icon: any, description: string }) => (
  <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
    <div className="w-full flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          {title}
        </h1>
        <p className="text-foreground/60 text-lg max-w-2xl">
          {description}
        </p>
      </div>
      <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/25 transition-all gap-2 cursor-pointer">
        <Plus className="w-4 h-4" />
        Novo Registro
      </Button>
    </div>

    {/* Abstract Empty State / Dashboard Preview */}
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
        <h3 className="text-foreground/70 font-medium text-sm mb-2 uppercase tracking-wide">Total de Registros</h3>
        <p className="text-4xl font-bold text-foreground">24</p>
      </div>
      <div className="bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
        <h3 className="text-foreground/70 font-medium text-sm mb-2 uppercase tracking-wide">Ativos</h3>
        <p className="text-4xl font-bold text-green-600 dark:text-green-400">18</p>
      </div>
      <div className="bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
        <h3 className="text-foreground/70 font-medium text-sm mb-2 uppercase tracking-wide">Pendentes</h3>
        <p className="text-4xl font-bold text-amber-500 dark:text-amber-400">6</p>
      </div>
    </div>

    {/* Placeholder Table Illustration */}
    <div className="w-full bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border/10 dark:border-border/50 flex items-center justify-between">
        <div className="w-64 h-8 bg-foreground/5 rounded-md animate-pulse" />
        <div className="flex gap-2">
            <div className="w-8 h-8 bg-foreground/5 rounded-md" />
            <div className="w-8 h-8 bg-foreground/5 rounded-md" />
        </div>
      </div>
      <div className="divide-y divide-border/10 dark:divide-border/50">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between hover:bg-foreground/5 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {String.fromCharCode(64 + i)}
              </div>
              <div className="space-y-1">
                <div className="w-48 h-4 bg-foreground/10 rounded animate-pulse" />
                <div className="w-32 h-3 bg-foreground/5 rounded" />
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
