"use client";

import { motion } from "framer-motion";

export const QuickStats = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="py-12 border-t border-foreground/10"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[
            { label: "Inspeções Realizadas", value: "24", change: "+3 este mês" },
            { label: "Média de Conformidade", value: "7.5", change: "+0.8 vs anterior" },
            { label: "Não Conformidades", value: "12", change: "3 pendentes" },
            { label: "Próxima Inspeção", value: "5", change: "dias restantes" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + index * 0.1 }}
              whileHover={{ y: -3 }}
              className="glass-card rounded-xl p-4 sm:p-5 executive-shadow transition-all duration-300 hover:bg-white/10"
            >
              <p className="text-foreground/50 text-xs sm:text-sm mb-1 truncate">{stat.label}</p>
              <p className="text-foreground text-2xl sm:text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-primary text-xs truncate">{stat.change}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
