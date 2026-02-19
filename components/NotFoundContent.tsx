"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

const NotFoundScene = dynamic(() => import("@/components/NotFoundScene"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0f172a]" />,
});

export default function NotFoundContent() {
  return (
    <div className="relative min-h-screen w-full bg-[#0f172a] overflow-hidden flex flex-col items-center justify-center font-sans text-white">
      
      {/* Cena 3D em background */}
      <NotFoundScene />
      
      {/* Conteúdo */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto backdrop-blur-sm bg-black/10 p-12 rounded-[3rem] border border-white/5 shadow-2xl animate-in fade-in zoom-in duration-700">
        <h1 className="text-[120px] font-black leading-none bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent drop-shadow-2xl">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-6 tracking-tight">
          Página não encontrada
        </h2>
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          Parece que você se perdeu no espaço. A página que você procura não existe ou foi movida para outra dimensão.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
                href="/home"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
                <Home className="w-5 h-5" />
                Ir para o Início
            </Link>
            
             <Link 
                href="/select-project"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold hover:bg-white/20 hover:scale-105 transition-all"
            >
                <ArrowLeft className="w-5 h-5" />
                Selecionar Projeto
            </Link>
        </div>
      </div>
      
      <div className="absolute bottom-10 text-slate-500 text-sm font-medium tracking-widest uppercase opacity-50">
        ViaBrasil Sistema de Engenharia
      </div>
    </div>
  );
}
