"use client";

import { motion } from "framer-motion";
import { 
  Folder, 
  File, 
  Search, 
  Upload, 
  Library, 
  Download, 
  Trash2, 
  MoreVertical,
  ChevronRight,
  FileText,
  FileBadge,
  HardDrive,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categories = [
  { name: "Manuais Técnicos", count: 12, icon: Library, color: "blue" },
  { name: "Contratos & CTRs", count: 8, icon: FileBadge, color: "emerald" },
  { name: "Normas ABNT/ANTT", count: 24, icon: FileText, color: "amber" },
  { name: "Projetos (As-Built)", count: 45, icon: HardDrive, color: "purple" }
];

const mockFiles = [
  { id: 1, name: "Manual_Inspecao_Rodoviaria_v2.pdf", size: "4.2 MB", type: "PDF", date: "Jan 12, 2025", category: "Manuais" },
  { id: 2, name: "Contrato_Concessao_ViaBrasil_Lote1.pdf", size: "15.8 MB", type: "PDF", date: "Jan 05, 2025", category: "Contratos" },
  { id: 3, name: "Planilha_Dimensionamento_Drenagem.xlsx", size: "1.1 MB", type: "Excel", date: "Dec 20, 2024", category: "Projetos" },
  { id: 4, name: "Norma_Sinalizacao_Vertical_ANTT.pdf", size: "2.5 MB", type: "PDF", date: "Nov 15, 2024", category: "Normas" },
  { id: 5, name: "Croqui_Trecho_01_KM120.dwg", size: "8.4 MB", type: "CAD", date: "Jan 24, 2025", category: "Projetos" }
];

export default function DocumentacaoView() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Folder className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
             </div>
             Biblioteca Digital
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Central de documentos técnicos, normas e arquivos do projeto.
          </p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="border-slate-200 dark:border-white/10 gap-2">
                <Info className="w-4 h-4" />
                Dúvidas
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-6 py-6 rounded-2xl gap-2 transition-all hover:scale-105 active:scale-95">
                <Upload className="w-5 h-5" />
                Fazer Upload
            </Button>
        </div>
      </div>

      {/* Category Folders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="group cursor-pointer"
            >
                <Card className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-all duration-300">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-${cat.color}-500/10 text-${cat.color}-600 dark:text-${cat.color}-400 group-hover:scale-110 transition-transform`}>
                            <cat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{cat.count} Arquivos</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
      </div>

      {/* Search & Explorer Header */}
      <div className="flex flex-col md:row items-center justify-between gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
                placeholder="Pesquisar por nome de arquivo..." 
                className="pl-11 bg-transparent border-none focus-visible:ring-0 text-slate-700 dark:text-slate-200 h-10"
            />
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <span>Ordem:</span>
            <select className="bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5">
                <option>Mais recentes</option>
                <option>Nome (A-Z)</option>
                <option>Tamanho</option>
            </select>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-8">
            <div className="flex-1">Nome do Arquivo</div>
            <div className="w-32 text-center">Tamanho</div>
            <div className="w-32 text-center">Data</div>
            <div className="w-24 text-right">Ações</div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-white/10">
            {mockFiles.map((file) => (
                <div key={file.id} className="group flex items-center p-4 px-8 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all cursor-pointer border-l-4 border-transparent hover:border-emerald-500">
                    <div className="flex-1 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                            ${file.type === 'PDF' ? 'bg-red-500/10 text-red-500' : 
                              file.type === 'Excel' ? 'bg-emerald-500/10 text-emerald-500' :
                              'bg-blue-500/10 text-blue-500'}
                        `}>
                            <File className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{file.name}</p>
                            <Badge variant="outline" className="text-[10px] mt-1 h-4 py-0 border-slate-200 dark:border-white/10 text-slate-500">{file.category}</Badge>
                        </div>
                    </div>
                    <div className="w-32 text-center text-sm font-medium text-slate-500 dark:text-slate-400">{file.size}</div>
                    <div className="w-32 text-center text-sm font-medium text-slate-500 dark:text-slate-400">{file.date}</div>
                    <div className="w-24 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full hover:bg-red-500/10 text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
        {/* Empty Space Filler */}
        <div className="p-20 flex flex-col items-center justify-center space-y-4 opacity-30 grayscale group">
             <Library className="w-16 h-16 text-slate-400 group-hover:animate-bounce" />
             <p className="font-medium text-slate-500 tracking-widest text-xs uppercase">Carregar mais arquivos</p>
        </div>
      </div>
    </div>
  );
}
