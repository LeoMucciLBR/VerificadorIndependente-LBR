"use client";

import { motion } from "framer-motion";
import { Edit, Trash2, Calendar, MoreVertical, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SettingsListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  status?: "active" | "inactive" | "pending" | "archived" | "warning";
  icon?: any;
  metadata?: { label: string; value: string }[];
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index: number;
}

export function SettingsListItem({
  title,
  subtitle,
  status,
  icon: Icon,
  metadata,
  onClick,
  onEdit,
  onDelete,
  index
}: SettingsListItemProps) {
  
  const getStatusColor = (s?: string) => {
    switch(s) {
      case 'active': return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
      case 'pending': return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
      case 'archived': return "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-500/30";
      case 'inactive': return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
      case 'warning': return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getStatusLabel = (s?: string) => {
     switch(s) {
      case 'active': return "Ativo";
      case 'pending': return "Pendente";
      case 'archived': return "Arquivado";
      case 'inactive': return "Inativo";
      case 'warning': return "Atenção";
      default: return s;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick || onEdit}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors cursor-pointer gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all duration-300">
          {Icon ? <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" /> : <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />}
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            {status && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
                {getStatusLabel(status)}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{subtitle}</p>
          )}

          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {metadata.map((meta, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="font-medium text-slate-700 dark:text-slate-400">{meta.label}:</span>
                  <span>{meta.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
          <Edit className="w-4 h-4" />
        </Button>
        {onDelete && (
           <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="h-8 w-8 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      </div>
    </motion.div>
  );
}
