"use client";

import { motion } from "framer-motion";
import ReportGenerator from "./ReportGenerator";
import ReportList from "./ReportList";

interface RelatoriosViewProps {
  projectSlug?: string;
}

export default function RelatoriosView({ projectSlug }: RelatoriosViewProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* BackgroundScene removed to use global layout background */}
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-16 pb-24 px-6 md:px-8 pt-12">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-4 text-center md:text-left"
        >
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-sans drop-shadow-sm">
              Central de Relatórios
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl font-light leading-relaxed">
              Visualize dados, gere relatórios executivos e acompanhe o desempenho de suas obras com inteligência.
            </p>
          </div>
        </motion.div>

        {/* Generator Section - The Hero */}
        <section className="relative z-20">
          <ReportGenerator projectSlug={projectSlug} />
        </section>

        {/* List Section - The Bento Grid */}
        <section className="relative z-10">
          <ReportList />
        </section>

      </div>
    </div>
  );
}
