"use client";

import { motion } from "framer-motion";

export default function RegistrosScene() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none bg-slate-950 overflow-hidden">
        {/* Base dark background */}
        <div className="absolute inset-0 bg-[#020617]" />
        
        {/* Aurora Gradient Orbs */}
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 50, 0] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px]" 
        />
        
        <motion.div 
            animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
                x: [0, -30, 0] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px]" 
        />

        <div 
            className="absolute top-[20%] right-[30%] w-[30%] h-[30%] rounded-full bg-violet-900/20 blur-[100px]" 
        />
        
        {/* Soft Noise Overlay for Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
}
