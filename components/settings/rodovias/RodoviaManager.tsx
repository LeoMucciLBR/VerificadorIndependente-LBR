"use client";

import { useState } from "react";
import { RodoviaList } from "./RodoviaList";
import { RodoviaDetails } from "./RodoviaDetails";
import { AnimatePresence, motion } from "framer-motion";

export function RodoviaManager() {
  const [selectedRodoviaId, setSelectedRodoviaId] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col">
       <AnimatePresence mode="wait">
          {!selectedRodoviaId ? (
             <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
             >
                <RodoviaList onSelect={(id) => setSelectedRodoviaId(id)} />
             </motion.div>
          ) : (
             <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
             >
                <RodoviaDetails 
                    rodoviaId={selectedRodoviaId} 
                    onBack={() => setSelectedRodoviaId(null)} 
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
}
