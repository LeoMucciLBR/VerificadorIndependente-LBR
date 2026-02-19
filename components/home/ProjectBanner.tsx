"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Download, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ProjectData {
  title?: string | null;
  heroImageUrl?: string | null;
  contractNumber?: string | null;
  clientName?: string | null;
  segmentName?: string | null;
  extension?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const ProjectBanner = ({ data }: { data?: ProjectData | null }) => {
  // Defaults if data is missing
  const title = data?.title || "BR-101/SC - Duplicação Florianópolis-Itajaí";
  const institution = data?.clientName || "DNIT - Departamento Nacional de Infraestrutura";
  const contract = data?.contractNumber || "TT-789/2023";
  const segment = data?.segmentName || "Km 143 ao Km 208";
  const extension = data?.extension || "65 km";
  
  const formatDate = (date?: Date | null) => {
    if (!date) return "15/03/2023";
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const startDate = formatDate(data?.startDate);
  const endDate = formatDate(data?.endDate);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative h-[450px] sm:h-[380px] md:h-[350px] overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src={data?.heroImageUrl || "/assets/highway-hero.jpg"}
          alt="Highway Infrastructure"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-6 sm:pb-8">
        {/* Project Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-2 mb-3"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-foreground/60 text-sm font-medium tracking-wide uppercase">
            Projeto
          </span>
        </motion.div>

        {/* Project Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 leading-tight"
        >
          {title}
        </motion.h1>

        {/* Project Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-foreground/70 text-xs sm:text-sm mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/70" />
            <span className="truncate max-w-[200px] sm:max-w-none">{institution}</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-foreground/20" />
          <div className="flex-shrink-0">
            <span className="text-foreground/50">Contrato:</span>{" "}
            <span className="font-medium">{contract}</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-foreground/20" />
          <div className="flex-shrink-0">
            <span className="text-foreground/50">Trecho:</span>{" "}
            <span className="font-medium">{segment}</span>
          </div>
          <div className="hidden lg:block w-px h-4 bg-foreground/20" />
          <div className="flex-shrink-0">
            <span className="text-foreground/50">Extensão:</span>{" "}
            <span className="font-medium">{extension}</span>
          </div>
        </motion.div>

        {/* Date Range & Export Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success flex-shrink-0" />
                <span className="text-foreground/50">Início:</span>
                <span className="text-foreground font-medium">{startDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
                <span className="text-foreground/50">Término:</span>
                <span className="text-foreground font-medium">{endDate}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-foreground/50">
                <span>Progresso</span>
                <span>{(() => {
                  const start = data?.startDate ? new Date(data.startDate) : new Date("2023-03-15");
                  const end = data?.endDate ? new Date(data.endDate) : new Date("2027-03-15");
                  const now = new Date();
                  const total = end.getTime() - start.getTime();
                  const current = now.getTime() - start.getTime();
                  const percent = Math.min(Math.max((current / total) * 100, 0), 100);
                  return `${percent.toFixed(0)}%`;
                })()}</span>
              </div>
              <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(() => {
                    const start = data?.startDate ? new Date(data.startDate) : new Date("2023-03-15");
                    const end = data?.endDate ? new Date(data.endDate) : new Date("2027-03-15");
                    const now = new Date();
                    const total = end.getTime() - start.getTime();
                    const current = now.getTime() - start.getTime();
                    return Math.min(Math.max((current / total) * 100, 0), 100);
                  })()}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
                  className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full relative overflow-hidden"
                >
                  <motion.div
                    className="absolute top-0 bottom-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          <Button
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar Relatório</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
};
