"use client";

import { useState, useRef, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Users,
  BarChart,
  BadgeInfo,
  Sigma,
  Pin,
  Variable,
  Building2,
  Sparkles,
  ArrowRight,
  Settings2,
  Activity,
  Layers,
  Map as MapIcon,
  Database,
  ArrowUpRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { SettingsViews } from "./SettingsViews";
import { cn } from "@/lib/utils";

const Settings3DBackground = dynamic(
  () => import("./Settings3DBackground").then(mod => ({ default: mod.Settings3DBackground })),
  { ssr: false }
);

// --- MODERN 3D CARD COMPONENT (ORIGINAL PREMIUM DESIGN) ---
function ModernCard({ 
    item, 
    onClick, 
    className = "" 
}: { 
    item: any, 
    onClick?: () => void, 
    className?: string 
}) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  
  // Dynamic Shine/Gradient
  const shineX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const shineY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative cursor-pointer group perspective-1000 h-full", className)}
      whileHover={{ scale: 1.02, z: 50 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Container Body - RESTORED ORIGINAL STYLING AND SIZE */}
      <div 
        className="relative h-64 w-full rounded-[2rem] bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/60 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300"
        style={{ transform: "translateZ(0px)" }}
      >
        {/* Dynamic Gradient Background (Subtle) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        
        {/* Shine Overlay */}
        <motion.div 
            className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
                background: `radial-gradient(circle at ${Number(x.get()) * 100 + 50}% ${Number(y.get()) * 100 + 50}%, rgba(255,255,255,0.4), transparent 60%)`
            }}
        />

        {/* Content Container */}
        <div className="relative h-full p-8 flex flex-col justify-between z-20" style={{ transformStyle: "preserve-3d" }}>
            
            {/* Header: Icon & Arrow */}
            <div className="flex justify-between items-start">
                 {/* Icon Orb */}
                 <motion.div 
                    style={{ transform: "translateZ(30px)" }}
                    className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center
                        bg-gradient-to-br ${item.gradient}
                        shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)]
                        ring-4 ring-white/20 dark:ring-white/5
                    `}
                 >
                    <div className="w-full h-full rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <item.icon className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                 </motion.div>

                 {/* Action Arrow */}
                 <motion.div 
                    style={{ transform: "translateZ(20px)" }}
                    className="w-10 h-10 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-blue-600 transition-all duration-300"
                 >
                    <ArrowUpRight className="w-5 h-5 text-slate-500 dark:text-white/50 group-hover:text-white dark:group-hover:text-blue-600 group-hover:rotate-45 transition-all duration-500" />
                 </motion.div>
            </div>

            {/* Text Content */}
            <motion.div style={{ transform: "translateZ(20px)" }}>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight tracking-tight group-hover:text-blue-700 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-white/80 transition-all">
                    {item.label}
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                </p>
            </motion.div>
        </div>
      </div>
      
      {/* Floating Shadow */}
      <motion.div 
         className={`absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br ${item.gradient} opacity-0 blur-2xl -z-10 group-hover:opacity-20 transition-opacity duration-500`}
         style={{ transform: "translateZ(-20px)" }}
      />
      
    </motion.div>
  );
}

// --- CONFIGURATION LIST (UNIFORM PRIMARY BLUE) ---
const menuItems = [
  {
    id: "phases",
    label: "Fases da Obra",
    icon: MapIcon,
    description: "Definição de etapas e trechos.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0
  },
  {
    id: "groups",
    label: "Grupos e Equipes",
    icon: Users,
    description: "Gestão hierárquica de times.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.05
  },
  {
    id: "indicators",
    label: "Indicadores (KPIs)",
    icon: Activity,
    description: "Configuração de métricas.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.1
  },
  {
    id: "characteristics",
    label: "Caracterização",
    icon: Layers,
    description: "Parâmetros técnicos e físicos.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.15
  },
  {
    id: "formulas",
    label: "Motor de Cálculo",
    icon: Sigma,
    description: "Algoritmos para notas automáticas.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.2
  },
  {
    id: "constants",
    label: "Constantes Globais",
    icon: Pin,
    description: "Valores normativos fixos.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.25
  },
  {
    id: "variables",
    label: "Variáveis Dinâmicas",
    icon: Variable,
    description: "Inputs variáveis por segmento.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.3
  },
  {
    id: "dashboards",
    label: "UI do Dashboard",
    icon: BarChart,
    description: "Customização visual dos cards.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.35
  },
  {
    id: "institutions",
    label: "Multi-Empresas",
    icon: Building2,
    description: "Gerenciamento corporativo.",
    gradient: "from-blue-600 to-blue-800",
    delay: 0.4
  },
];

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 dark:bg-[#0f172a] relative perspective-[2000px] font-sans transition-colors duration-300">
      
      {/* 3D Background - Adaptable */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="dark:opacity-100 opacity-20">
             <Settings3DBackground />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-[#0f172a] dark:via-[#0f172a]/80 dark:to-transparent" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      <AnimatePresence mode="wait">
        {!activeSection ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 h-full overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-12"
          >
            <div className="max-w-[1600px] mx-auto">
              
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-16 mt-4 relative"
              >
                <div className="absolute -left-6 top-0 w-1 h-24 bg-blue-600 hidden lg:block rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter drop-shadow-2xl">
                  Central de <span className="text-blue-600 dark:text-blue-500">Comando</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-light leading-relaxed">
                  Gerencie todos os aspectos vitais do sistema ViaBrasil em um único ambiente tridimensional.
                </p>
              </motion.div>

              {/* Grid System - LARGE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-24">
                
                {/* --- SPECIAL FEATURE CARD (Wide) - UNIFORM BLUE --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="md:col-span-2 xl:col-span-2 relative h-64 rounded-[2rem] overflow-hidden group cursor-pointer border border-blue-500/30 shadow-xl shadow-blue-500/10 hover:shadow-2xl transition-all"
                    onClick={() => setActiveSection("rodovias")}
                >
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                     
                     <div className="relative h-full p-10 flex flex-col justify-center items-start z-10">
                        <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-xs uppercase tracking-widest mb-4 shadow-lg">
                           Módulo Principal
                        </div>
                        <h3 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
                           Gestão de Rodovias
                        </h3>
                        <p className="text-blue-100/90 font-medium text-lg max-w-md leading-relaxed mb-6">
                           Mapeamento completo de eixos, marcos quilométricos e segmentação inteligente.
                        </p>
                        
                        <div className="flex items-center gap-3 text-white font-bold group-hover:translate-x-2 transition-transform">
                           Acessar Painel <ArrowRight className="w-5 h-5" />
                        </div>
                     </div>
                     
                     {/* 3D Decor Element */}
                     <div className="absolute -right-10 -bottom-20 w-80 h-80 rounded-full border-[20px] border-white/10 blur-sm group-hover:rotate-45 transition-transform duration-1000 ease-in-out" />
                </motion.div>

                {menuItems.map((item) => (
                    <motion.div
                       key={item.id}
                       initial={{ opacity: 0, y: 50 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: item.delay, duration: 0.6, ease: "easeOut" }}
                    >
                        <ModernCard 
                            item={item} 
                            onClick={() => (item as any).path ? router.push((item as any).path) : setActiveSection(item.id)}
                            className="h-full"
                        />
                    </motion.div>
                ))}
            
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 h-full flex flex-col bg-slate-50 dark:bg-[#0f172a]"
          >
            {/* Detail Header */}
            <div className="flex-shrink-0 px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl z-30 relative">
               <button
                  onClick={() => setActiveSection(null)}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-100 dark:bg-white/5 group-hover:bg-blue-50 dark:group-hover:bg-white/10 transition-all">
                     <ArrowRight className="w-5 h-5 text-slate-600 dark:text-white rotate-180" />
                  </div>
                  <div className="text-left">
                     <span className="block text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Voltar para</span>
                     <span className="block font-bold text-lg text-slate-900 dark:text-white">Central de Comando</span>
                  </div>
               </button>

               <div className="hidden sm:flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">Módulo Ativo</span>
                    <span className="text-slate-900 dark:text-white font-black text-xl tracking-tight">{menuItems.find(i => i.id === activeSection)?.label || "Rodovias"}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${menuItems.find(i => i.id === activeSection)?.gradient || 'from-blue-600 to-blue-800'} shadow-lg flex items-center justify-center ring-2 ring-white/10`}>
                      {(() => {
                          const Icon = menuItems.find(i => i.id === activeSection)?.icon || MapIcon;
                          return <Icon className="w-6 h-6 text-white" />;
                      })()}
                  </div>
               </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] p-4 lg:p-10 relative">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
               <div className="relative max-w-7xl mx-auto bg-white/60 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden min-h-[600px] shadow-2xl backdrop-blur-sm">
                 <SettingsViews activeSection={activeSection!} />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
