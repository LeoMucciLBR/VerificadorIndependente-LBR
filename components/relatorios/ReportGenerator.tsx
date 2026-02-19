"use client";

import { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CreateReportModal from "./CreateReportModal";
import InteractiveIcon from "./3d/InteractiveIcon";

interface ReportGeneratorProps {
  projectSlug?: string;
}

export default function ReportGenerator({ projectSlug }: ReportGeneratorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);



  return (
    <div className="relative w-full max-w-5xl mx-auto mb-16 perspective-1000">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-950/80 backdrop-blur-3xl border border-slate-100 dark:border-white/10 shadow-2xl dark:shadow-none">
          
          {/* Decorative Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:32px_32px] pointer-events-none" />
          
          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
            
            {/* Left Content */}
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Novo Sistema de Relatórios</span>
                </motion.div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  Gere relatórios <br />
                  <span className="text-primary">
                    inteligentes
                  </span>
                </h2>
                
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto md:mx-0 leading-relaxed">
                  Utilize nossa IA para compilar dados complexos em análises claras e acionáveis em segundos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button
                  onClick={() => setIsModalOpen(true)}
                  size="lg"
                  className="relative overflow-hidden h-14 px-8 text-lg font-semibold transition-all duration-500 group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-2xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Gerar Agora
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="lg"
                  className="h-14 px-6 text-slate-600 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-white/5 rounded-2xl"
                >
                  Ver Histórico
                </Button>
              </div>
            </div>

            {/* Right Content - 3D Icon Container */}
            <div className="flex-1 w-full max-w-[300px] aspect-square relative flex items-center justify-center">
               <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-slow" />
               <div className="relative w-full h-full z-10">
                 {/* This wrapper ensures the canvas in InteractiveIcon has size */}
                 <div className="w-full h-full">
                   <InteractiveIcon />
                 </div>
               </div>
            </div>
            
          </div>
        </div>
      </motion.div>
      <CreateReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        projectSlug={projectSlug}
      />
    </div>
  );
}
