"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import OccurrenceDetailsContent from "./OccurrenceDetailsContent";

type OccurrenceDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  registro: any;
};

export default function OccurrenceDetailsModal({ isOpen, onClose, registro }: OccurrenceDetailsModalProps) {
  
  if (!registro) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 md:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/60 dark:bg-[#020617]/80 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div 
             initial={{ scale: 0.95, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.95, opacity: 0, y: 20 }}
             transition={{ type: "spring", damping: 30, stiffness: 300 }}
             className="
                relative w-full max-w-4xl max-h-[90vh] 
                bg-white dark:bg-[#0f172a] 
                border border-slate-200 dark:border-white/10 
                rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50
                flex flex-col overflow-hidden text-slate-900 dark:text-white
             "
          >
            <OccurrenceDetailsContent 
                registro={registro} 
                onClose={onClose} 
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
