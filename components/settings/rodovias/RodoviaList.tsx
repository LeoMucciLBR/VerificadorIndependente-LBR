"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Ruler, Search, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRodovias } from "@/app/actions/rodovias"; // Server Action
import { RodoviaForm } from "./RodoviaForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Rodovia {
  id: string; // serialized BigInt
  nome: string;
  codigo?: string;
  extensao?: number;
  concessionaria?: string;
  _count?: {
      marcos_quilometricos: number;
      segmentos_homogeneos: number;
  }
}

interface RodoviaListProps {
  onSelect: (id: string) => void;
}

export function RodoviaList({ onSelect }: RodoviaListProps) {
  const [rodovias, setRodovias] = useState<Rodovia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getRodovias();
    if (res.success) {
      setRodovias((res.data ?? []) as unknown as Rodovia[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = rodovias.filter(r => 
      r.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-500" />
            Ativos Rodoviários
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie as rodovias, geometria e segmentação do projeto.
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Rodovia
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <RodoviaForm onSuccess={() => {
                    setIsCreateOpen(false);
                    loadData();
                }} />
            </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
            placeholder="Buscar por nome ou código..." 
            className="pl-10 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {loading ? (
             <div className="col-span-full flex justify-center py-12">
                 <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
             </div>
        ) : filtered.length === 0 ? (
             <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                 Nenhuma rodovia encontrada.
             </div>
        ) : (
            filtered.map((rodovia) => (
                <motion.div
                    key={rodovia.id}
                    layoutId={`rodovia-${rodovia.id}`}
                    onClick={() => onSelect(rodovia.id)}
                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5 hover:shadow-lg hover:border-orange-500/50 transition-all cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-orange-500" />
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-bold">
                                {rodovia.codigo || "S/C"}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                            {rodovia.nome}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {rodovia.concessionaria || "Concessionária não informada"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5" />
                            <span>{rodovia.extensao} km</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{rodovia._count?.marcos_quilometricos || 0} marcos</span>
                        </div>
                    </div>
                </motion.div>
            ))
        )}
      </div>
    </div>
  );
}
