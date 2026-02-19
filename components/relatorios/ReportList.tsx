"use client";

import { 
  FileText, 
  Download, 
  MoreVertical, 
  Calendar, 
  User, 
  FileSpreadsheet,
  Star
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Mock Data
const reports = [
  {
    id: 1,
    title: "Relatório de Execução Financeira - Q1 2024",
    type: "PDF",
    size: "2.4 MB",
    date: "10/02/2024",
    author: "Ana Silva",
    status: "Finalizado",
    featured: true, // Item highlighted in Bento Grid
  },
  {
    id: 2,
    title: "Análise de Ocorrências - Jan/24",
    type: "XLSX",
    size: "1.8 MB",
    date: "08/02/2024",
    author: "Carlos Oliveira",
    status: "Revisão",
    featured: false,
  },
  {
    id: 3,
    title: "Vistoria Técnica - BR-163",
    type: "PDF",
    size: "15.2 MB",
    date: "05/02/2024",
    author: "Eng. Marcos",
    status: "Finalizado",
    featured: false,
  },
  {
    id: 4,
    title: "Resumo Executivo Anual 2023",
    type: "PDF",
    size: "5.5 MB",
    date: "01/02/2024",
    author: "Diretoria",
    status: "Finalizado",
    featured: true,
  },
  {
    id: 5,
    title: "Levantamento Fotográfico - Trecho Sul",
    type: "PDF",
    size: "45.1 MB",
    date: "28/01/2024",
    author: "Equipe Campo",
    status: "Processando",
    featured: false,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ReportList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">
          Relatórios Recentes
        </h3>
        <Button variant="outline" className="rounded-full">
          Ver Todos
        </Button>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]"
      >
        {reports.map((report) => (
          <motion.div
            key={report.id}
            variants={itemAnim}
            className={`group relative rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
              ${report.featured ? 'md:col-span-2 bg-primary/5 border-primary/20' : 'bg-white dark:bg-slate-950/80 border-slate-100 dark:border-white/10'}
              backdrop-blur-xl border shadow-sm dark:shadow-none overflow-hidden
            `}
          >
            {/* Hover Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:via-blue-500/5 transition-all duration-500" />

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${
                  report.type === 'PDF' 
                    ? 'bg-red-500/10 text-red-500' 
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {report.type === 'PDF' ? <FileText className="w-6 h-6" /> : <FileSpreadsheet className="w-6 h-6" />}
                </div>

                <div className="flex items-center gap-2">
                   {report.featured && (
                     <div className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium flex items-center gap-1">
                       <Star className="w-3 h-3 fill-amber-500" />
                       Destaque
                     </div>
                   )}
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Visualizar</DropdownMenuItem>
                      <DropdownMenuItem>Baixar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                  {report.title}
                </h4>
                
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {report.date}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {report.author}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  report.status === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  report.status === 'Revisão' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  'bg-primary/10 text-primary'
                }`}>
                  {report.status}
                </span>
                <Button variant="ghost" size="sm" className="gap-2 text-slate-600 dark:text-slate-300 hover:text-primary group/btn">
                  Download
                  <Download className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
