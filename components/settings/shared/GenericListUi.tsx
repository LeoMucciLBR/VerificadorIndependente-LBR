"use client";

import { motion } from "framer-motion";
import { Plus, Search, Filter, MoreVertical, LayoutGrid, List as ListIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Generic Interface for List Items
 * Adapts different prisma models to a standard display format
 */
export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: "active" | "inactive" | "pending" | "archived";
  badge?: string; // Small badge text like "KM 100-200"
  icon?: any;    // Optional icon override
  metadata?: { label: string, value: string }[];
  originalData: any; // Keep ref to original object
}

interface GenericListUiProps {
  title: string;
  subtitle: string;
  items: ListItem[];
  isLoading?: boolean;
  onNew: () => void;
  onEdit: (item: ListItem) => void;
  onDelete?: (item: ListItem) => void;
  stats?: { label: string, value: string | number, color?: string }[];
  emptyMessage?: string;
  viewType?: "list" | "grid";
}

export function GenericListUi({ 
  title, 
  subtitle, 
  items, 
  isLoading, 
  onNew, 
  onEdit, 
  stats,
  emptyMessage = "Nenhum registro encontrado.",
  viewType: initialViewType = "list"
}: GenericListUiProps) {
  const [viewType, setViewType] = useState(initialViewType);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[1400px] mx-auto space-y-8"
    >
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        
        <Button 
          onClick={onNew}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-6 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 group"
        >
          <div className="bg-white/20 rounded-lg p-1 mr-3 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base">Novo Registro</span>
        </Button>
      </div>

      {/* --- STATS OVERVIEW --- */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color || "text-slate-900 dark:text-white")}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* --- CONTROLS BAR --- */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Buscar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto p-1">
          <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Filter className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewType("grid")}
            className={cn("shrink-0", viewType === "grid" ? "bg-white shadow text-blue-600 dark:bg-white/10 dark:text-white" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setViewType("list")}
            className={cn("shrink-0", viewType === "list" ? "bg-white shadow text-blue-600 dark:bg-white/10 dark:text-white" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")}
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* --- LIST CONTENT --- */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p>Carregando dados...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium text-slate-900 dark:text-white">{emptyMessage}</p>
          <p className="text-sm">Tente ajustar seus filtros ou crie um novo registro.</p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-4",
          viewType === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onEdit(item)}
              className={cn(
                "group relative bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-200 dark:border-white/5 hover:border-blue-400 dark:hover:border-blue-500/50 overflow-hidden",
                viewType === "grid" ? "rounded-3xl p-6 flex flex-col items-start h-full" : "rounded-2xl p-4 flex items-center gap-6"
              )}
            >
              {/* Status Indicator */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                item.status === 'active' ? "bg-emerald-500" :
                item.status === 'inactive' ? "bg-slate-300 dark:bg-slate-700" :
                item.status === 'pending' ? "bg-amber-500" : "bg-blue-500"
              )} />

              {/* Icon / Image */}
              <div className={cn(
                 "rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm",
                 viewType === "grid" ? "w-14 h-14 mb-4" : "w-12 h-12"
              )}>
                 {item.icon || <div className="w-2 h-2 rounded-full bg-current" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                   {item.badge && (
                     <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                        {item.badge}
                     </span>
                   )}
                   <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                   </h3>
                </div>
                {item.subtitle && (
                   <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">
                      {item.subtitle}
                   </p>
                )}
                
                {/* Metadata Grid */}
                {viewType === "grid" && item.metadata && (
                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 w-full grid grid-cols-2 gap-3">
                      {item.metadata.slice(0, 4).map((meta, mIdx) => (
                        <div key={mIdx}>
                           <p className="text-[10px] text-slate-400 uppercase tracking-wider">{meta.label}</p>
                           <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{meta.value}</p>
                        </div>
                      ))}
                   </div>
                )}
              </div>

              {/* Actions */}
              <div className={cn("text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors", viewType === "grid" ? "absolute top-6 right-6" : "")}>
                <MoreVertical className="w-5 h-5" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
