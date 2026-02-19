"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: React.ReactNode;
  value: string | number | null;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  name?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  icon,
  disabled = false,
  searchable = false,
  className,
  name
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value == value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Updates coordinates when opening
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Handle click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
            return;
        }
        const dropdown = document.getElementById(`select-dropdown-${name || 'generic'}`);
        if (dropdown && dropdown.contains(event.target as Node)) {
            return;
        }
        setIsOpen(false);
    }
    
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("resize", () => setIsOpen(false));
        
        // Bloquear scroll de elementos pai scrolláveis
        const scrollableParents: HTMLElement[] = [];
        let parent = triggerRef.current?.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflow === 'auto' || style.overflow === 'scroll' || 
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
                scrollableParents.push(parent);
                parent.style.overflow = 'hidden';
            }
            parent = parent.parentElement;
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("resize", () => setIsOpen(false));
            // Restaurar scroll dos elementos pai
            scrollableParents.forEach(el => {
                el.style.overflow = '';
            });
        };
    }
    
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("resize", () => setIsOpen(false));
    };
  }, [isOpen, name]);

  // Focus search input
  React.useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!isOpen) {
        setSearchQuery("");
    }
  }, [isOpen, searchable]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <div className="mb-2">{label}</div>}
      
      {name && <input type="hidden" name={name} value={value || ""} />}

      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "relative w-full text-left bg-white dark:bg-[#1E293B]/70 hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 text-sm border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 rounded-xl px-4 py-3 outline-none transition-all duration-200 flex items-center gap-3",
          isOpen && "border-blue-500/50 ring-2 ring-blue-500/10 bg-white dark:bg-[#1E293B]",
          disabled && "opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-[#1E293B]/70 hover:border-slate-200 dark:hover:border-white/5"
        )}
        whileTap={{ scale: disabled ? 1 : 0.995 }}
      >
        {icon && (
          <span className={cn("text-slate-400 group-hover:text-slate-300 transition-colors", isOpen && "text-blue-400")}>
            {icon}
          </span>
        )}

        <div className="flex-1 truncate flex items-center gap-2">
            {selectedOption ? (
                <>
                    {selectedOption.icon && <span className="text-slate-400">{selectedOption.icon}</span>}
                    <div className="flex flex-col leading-snug">
                         <span className={cn("text-slate-200 font-medium", !selectedOption.subLabel && "py-0.5")}>{selectedOption.label}</span>
                         {selectedOption.subLabel && <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{selectedOption.subLabel}</span>}
                    </div>
                </>
            ) : (
                <span className="text-slate-500">{placeholder}</span>
            )}
        </div>

        <ChevronDown 
            className={cn(
                "w-4 h-4 text-slate-500 transition-transform duration-300", 
                isOpen && "rotate-180 text-blue-400"
            )} 
        />
      </motion.button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            id={`select-dropdown-${name || 'generic'}`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            style={{
                position: 'absolute',
                top: coords.top + 8,
                left: coords.left,
                width: coords.width,
                zIndex: 9999
            }}
            className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden ring-1 ring-slate-200 dark:ring-white/5 backdrop-blur-xl"
          >
            {searchable && (
              <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1E293B]/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-white/5 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#0B1121]/80 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    onKeyDown={(e) => e.stopPropagation()} 
                  />
                  {searchQuery && (
                    <button 
                        onClick={(e) => { e.preventDefault(); setSearchQuery(""); inputRef.current?.focus(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                        <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div 
              className="max-h-[280px] overflow-y-auto overscroll-contain custom-scrollbar p-1.5 space-y-0.5"
              onWheel={(e) => e.stopPropagation()}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                      opt.value == value
                        ? "bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                        {opt.icon && (
                            <span className={cn(
                                "shrink-0",
                                opt.value == value ? "text-blue-400" : "text-slate-500 group-hover:text-slate-400"
                            )}>{opt.icon}</span>
                        )}
                        <div className="flex flex-col items-start truncate w-full">
                            <span className="truncate w-full">{opt.label}</span>
                            {opt.subLabel && <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold group-hover:text-slate-400">{opt.subLabel}</span>}
                        </div>
                    </div>
                    
                    {opt.value == value && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                    <Search className="w-6 h-6 opacity-20" />
                    <p>Nenhum resultado</p>
                </div>
              )}
            </div>
            
            {searchable && filteredOptions.length > 5 && (
                <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-slate-600 text-center bg-[#0B1121]/50">
                    {filteredOptions.length} opções
                </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
