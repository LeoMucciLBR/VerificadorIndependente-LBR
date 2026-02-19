"use client";

import { motion } from "framer-motion";
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ label, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm flex flex-col gap-1 shadow-sm">
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
        {trend && (
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", 
            trendUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
          )}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

interface SettingsPageLayoutProps {
  title: string;
  description: string;
  icon?: any;
  stats?: StatCardProps[];
  children: React.ReactNode;
  onNew?: () => void;
  newLabel?: string;
  searchPlaceholder?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function SettingsPageLayout({ 
  title, 
  description, 
  icon: Icon, 
  stats, 
  children,
  onNew,
  newLabel = "Novo Registro",
  searchPlaceholder = "Buscar registros...",
  searchTerm,
  onSearchChange
}: SettingsPageLayoutProps) {
  
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNew && (
            <Button onClick={onNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-lg h-10 px-6 font-medium transition-all hover:scale-105 active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              {newLabel}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </motion.div>
      )}

      {/* Filters Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm backdrop-blur-xl"
      >
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder={searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm rounded-lg"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none border-slate-200 dark:border-white/10 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/5">
            <button className="p-1.5 rounded-md bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400">
              <ListIcon className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden min-h-[400px]"
      >
        {children}
      </motion.div>
    </div>
  );
}
