"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, Layers, BarChart, BadgeInfo, 
  Sigma, UserCog, Building2, FolderKanban, 
  Variable, Sparkles, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsViews } from "@/components/settings/SettingsViews";
import { SettingsForm } from "./SettingsForm";

interface SettingsShellProps {
  initialSettings: any;
}

export function SettingsShell({ initialSettings }: SettingsShellProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("general");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const changeSection = (sectionId: string) => {
    setActiveSection(sectionId);
    router.push(`/admin/settings?view=${sectionId}`, { scroll: false });
  };

  const menuItems = [
    {
      category: "Geral",
      items: [
        { id: "general", label: "Dados do Projeto", icon: FolderKanban, color: "emerald" }
      ]
    },
    {
      category: "Estrutura Base",
      items: [
        { id: "phases", label: "Fases de Obra", icon: LayoutGrid, color: "blue" },
        { id: "groups", label: "Grupos e Hierarquia", icon: Layers, color: "purple" }
      ]
    },
    {
      category: "Definições Técnicas",
      items: [
        { id: "indicators", label: "Indicadores", icon: BarChart, color: "cyan" },
        { id: "caracterizacoes", label: "Caracterizações", icon: BadgeInfo, color: "pink" }
      ]
    },
    {
      category: "Parâmetros e Cálculo",
      items: [
        { id: "params", label: "Variáveis e Constantes", icon: Variable, color: "amber" },
        { id: "formulas", label: "Motor de Cálculo", icon: Sigma, color: "orange" }
      ]
    },
    {
      category: "Administrativo",
      items: [
        { id: "institutions", label: "Instituições", icon: Building2, color: "indigo" },
        { id: "users", label: "Usuários e Permissões", icon: UserCog, color: "violet" }
      ]
    }
  ];

  const colorVariants: Record<string, { bg: string; text: string; hover: string; active: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", hover: "hover:bg-emerald-500/20", active: "bg-gradient-to-r from-emerald-500 to-teal-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-600", hover: "hover:bg-blue-500/20", active: "bg-gradient-to-r from-blue-500 to-cyan-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-600", hover: "hover:bg-purple-500/20", active: "bg-gradient-to-r from-purple-500 to-pink-500" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600", hover: "hover:bg-cyan-500/20", active: "bg-gradient-to-r from-cyan-500 to-blue-500" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-600", hover: "hover:bg-pink-500/20", active: "bg-gradient-to-r from-pink-500 to-rose-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-600", hover: "hover:bg-amber-500/20", active: "bg-gradient-to-r from-amber-500 to-yellow-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-600", hover: "hover:bg-orange-500/20", active: "bg-gradient-to-r from-orange-500 to-red-500" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600", hover: "hover:bg-indigo-500/20", active: "bg-gradient-to-r from-indigo-500 to-purple-500" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-600", hover: "hover:bg-violet-500/20", active: "bg-gradient-to-r from-violet-500 to-fuchsia-500" },
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] overflow-hidden">
      {/* Sidebar Navigation with Glass Effect */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-gradient-to-br from-white/80 to-zinc-50/80 dark:from-zinc-900/80 dark:to-black/80 backdrop-blur-xl border-r border-white/20 dark:border-white/10 overflow-y-auto flex-shrink-0 shadow-2xl"
      >
        <div className="p-6 sticky top-0 bg-gradient-to-b from-white/90 to-white/50 dark:from-zinc-900/90 dark:to-zinc-900/50 backdrop-blur-lg z-10 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Configurações</h2>
              <p className="text-sm font-semibold text-foreground">Painel de Controle</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-8">
          {menuItems.map((group, idx) => (
            <motion.div 
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <h3 className="px-3 text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-3">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map(item => {
                  const isActive = activeSection === item.id;
                  const isHovered = hoveredItem === item.id;
                  const colors = colorVariants[item.color] || colorVariants.blue;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => changeSection(item.id)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden group",
                        isActive 
                          ? `${colors.active} text-white shadow-lg` 
                          : `text-foreground/70 hover:text-foreground ${colors.hover}`
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      
                      <div className="relative z-10 flex items-center gap-3 flex-1">
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all duration-300",
                          isActive ? "bg-white/20" : `${colors.bg}`
                        )}>
                          <item.icon className={cn(
                            "w-4 h-4 transition-all duration-300",
                            isActive ? "text-white" : colors.text
                          )} />
                        </div>
                        <span className="relative z-10">{item.label}</span>
                      </div>

                      <ChevronRight className={cn(
                        "w-4 h-4 transition-all duration-300 relative z-10",
                        isActive ? "opacity-100 translate-x-0 text-white" : "opacity-0 -translate-x-2 group-hover:opacity-70 group-hover:translate-x-0"
                      )} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 dark:from-[#0a192f] dark:via-[#0f1f35] dark:to-[#0a192f]">
        {/* Decorative Background  */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.05),transparent_50%)] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto relative z-10"
          >
            {activeSection === "general" ? (
              <div className="p-8">
                <div className="max-w-5xl mx-auto">
                  {/* Header with Gradient */}
                  <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-4">
                      <FolderKanban className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Configurações Gerais</span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
                      Dados do Projeto
                    </h1>
                    <p className="text-lg text-foreground/60">Informações básicas exibidas na tela inicial e relatórios.</p>
                  </div>

                  {/* Form Card */}
                  <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl p-8">
                    <SettingsForm settings={initialSettings} />
                  </div>

                  {/* Quick Access Cards */}
                  <div className="mt-12">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Acesso Rápido aos Módulos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { id: 'indicators', icon: BarChart, label: 'Indicadores', desc: 'Defina KPIs e métricas', color: 'cyan' },
                        { id: 'caracterizacoes', icon: BadgeInfo, label: 'Caracterizações', desc: 'Regras e especificações', color: 'pink' },
                        { id: 'params', icon: Variable, label: 'Parâmetros', desc: 'Valores de configuração', color: 'amber' },
                        { id: 'formulas', icon: Sigma, label: 'Fórmulas', desc: 'Motor de cálculo', color: 'orange' }
                      ].map((item) => {
                        const colors = colorVariants[item.color];
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => changeSection(item.id)}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-start p-5 rounded-xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:border-primary/30 hover:shadow-xl transition-all text-left group"
                          >
                            <div className={cn(
                              "p-3 rounded-xl mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg",
                              colors.bg
                            )}>
                              <item.icon className={cn("w-6 h-6", colors.text)} />
                            </div>
                            <span className="font-bold text-foreground mb-1">{item.label}</span>
                            <span className="text-xs text-foreground/50">{item.desc}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <SettingsViews activeSection={activeSection} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
