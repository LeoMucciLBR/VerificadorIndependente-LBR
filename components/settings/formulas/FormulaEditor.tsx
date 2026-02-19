"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calculator, Variable, Binary, BarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Token {
  id: string;
  code: string;
  label: string;
  type: 'indicator' | 'constant' | 'variable';
  value?: string; // For constants preview
}

interface FormulaEditorProps {
  value: string;
  onChange: (value: string) => void;
  indicators: any[];
  constants: any[];
  variables: any[];
}

export function FormulaEditor({ value, onChange, indicators, constants, variables }: FormulaEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<'indicators' | 'constants' | 'variables'>('indicators');
  const [searchTerm, setSearchTerm] = useState("");

  const insertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const newText = text.substring(0, start) + token + text.substring(end);
    
    onChange(newText);

    // Restore focus and move cursor
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  const getFilteredTokens = () => {
    let tokens: Token[] = [];
    
    if (activeTab === 'indicators') {
      tokens = indicators.map(i => ({ 
        id: i.id, code: `{{${i.sigla}}}`, label: i.nome, type: 'indicator' 
      }));
    } else if (activeTab === 'constants') {
       tokens = constants.map(c => ({ 
        id: c.id, code: `{${c.nome}}`, label: c.nome, type: 'constant', value: c.valor 
      }));
    } else {
       tokens = variables.map(v => ({ 
        id: v.id, code: `{${v.nome}}`, label: v.nome, type: 'variable', value: v.valorPadrao 
      }));
    }

    return tokens.filter(original => 
      original.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      original.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const operators = ['+', '-', '*', '/', '(', ')', '.', '^'];

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[500px] border border-border/10 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
      {/* Editor Area (Left) */}
      <div className="flex-1 flex flex-col p-4 gap-4 border-r border-border/10">
         <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Expressão Matemática
            </label>
            <div className="flex gap-1">
                {operators.map(op => (
                    <button
                        key={op}
                        type="button"
                        onClick={() => insertToken(op)}
                        className="w-8 h-8 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-mono text-sm border border-border/10 transition-colors"
                    >
                        {op}
                    </button>
                ))}
            </div>
         </div>
         
         <div className="relative flex-1">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-full resize-none bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg p-4 font-mono text-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground leading-relaxed"
                placeholder="Ex: ({{IND_EXEC}} * {CONST_PESO}) / 100"
                spellCheck={false}
            />
            <div className="absolute bottom-4 right-4 text-xs text-foreground/30 pointer-events-none">
                {value.length} caracteres
            </div>
         </div>
         
         <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-lg border border-border/10 text-xs text-foreground/60 italic">
            Dica: Use os painéis à direita para inserir métricas e variáveis validadas.
         </div>
      </div>

      {/* Sidebar (Right) */}
      <div className="w-full md:w-[320px] flex flex-col bg-zinc-50/50 dark:bg-white/[0.02]">
         {/* Tabs */}
         <div className="flex border-b border-border/10">
            <button
                type="button"
                onClick={() => setActiveTab('indicators')}
                className={cn(
                    "flex-1 p-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center gap-1",
                    activeTab === 'indicators' 
                        ? "border-primary text-primary bg-primary/5" 
                        : "border-transparent text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                )}
            >
                <BarChart2 className="w-4 h-4" />
                Indicadores
            </button>
            <button
                type="button"
                onClick={() => setActiveTab('constants')}
                className={cn(
                    "flex-1 p-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center gap-1",
                    activeTab === 'constants' 
                        ? "border-primary text-primary bg-primary/5" 
                        : "border-transparent text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                )}
            >
                <Binary className="w-4 h-4" />
                Constantes
            </button>
            <button
                type="button"
                onClick={() => setActiveTab('variables')}
                className={cn(
                    "flex-1 p-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center gap-1",
                    activeTab === 'variables' 
                        ? "border-primary text-primary bg-primary/5" 
                        : "border-transparent text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                )}
            >
                <Variable className="w-4 h-4" />
                Variáveis
            </button>
         </div>

         {/* Search */}
         <div className="p-3 border-b border-border/10">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-foreground/30" />
                <input 
                    type="text" 
                    placeholder="Filtrar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-border/10 rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
            </div>
         </div>

         {/* List */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {getFilteredTokens().length === 0 ? (
                <div className="text-center py-8 text-foreground/40 text-xs">
                    Nenhum item encontrado.
                </div>
            ) : (
                getFilteredTokens().map(token => (
                    <motion.button
                        key={token.id}
                        type="button"
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => insertToken(token.code)}
                        className="w-full text-left p-3 rounded-lg bg-white dark:bg-zinc-900 border border-border/10 hover:border-primary/30 shadow-sm transition-all group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-foreground truncate max-w-[180px]" title={token.label}>
                                {token.label}
                            </span>
                            <Plus className="w-3 h-3 text-foreground/20 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex items-center justify-between">
                            <code className="text-[10px] bg-foreground/5 px-1.5 py-0.5 rounded text-foreground/60 font-mono">
                                {token.code}
                            </code>
                            {token.value !== undefined && (
                                <span className="text-[10px] text-foreground/40 font-mono">
                                    = {token.value}
                                </span>
                            )}
                        </div>
                    </motion.button>
                ))
            )}
         </div>
      </div>
    </div>
  );
}
