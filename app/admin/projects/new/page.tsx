'use client';

import { createProject } from "../actions";
import { Building2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createProject(formData);
    } catch (error) {
      alert("Erro ao criar projeto. Verifique os dados.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link 
            href="/admin/projects"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Novo Projeto</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Cadastre um novo contrato ou concessão.</p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl overflow-hidden p-8">
        <form action={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nome do Projeto</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            name="nome"
                            type="text" 
                            required
                            placeholder="Ex: Concessão BR-101"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Código</label>
                    <input 
                        name="codigo"
                        type="text" 
                        required
                        placeholder="Ex: LBR-101"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Slug (URL)</label>
                    <input 
                        name="slug"
                        type="text" 
                        required
                        placeholder="Ex: lbr-101"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm lowercase"
                    />
                </div>

                <div className="space-y-2 flex items-center pt-8">
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="ativo" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Projeto Ativo</span>
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Descrição</label>
                <textarea 
                    name="descricao"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium resize-none"
                    placeholder="Detalhes opcionais sobre o projeto..."
                />
            </div>

            <div className="pt-4 flex justify-end">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg hover:shadow-blue-600/25 active:scale-95"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    Salvar Projeto
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
