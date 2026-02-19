import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Building2, MoreHorizontal, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

async function getProjects() {
  return await prisma.projects.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { user_projects: true, rodovias: true }
      }
    }
  });
}

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Projetos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Gerencie os contratos e projetos do sistema.</p>
        </div>
        <Link 
          href="/admin/projects/new" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg hover:shadow-blue-600/25 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </Link>
      </div>

      <div className="rounded-[1.5rem] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200/50 dark:border-white/5 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar projetos..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="py-4 px-6">Projeto</th>
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Usuários</th>
                <th className="py-4 px-6 text-center">Rodovias</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
              {projects.map((project) => (
                <tr key={String(project.id)} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                            <Building2 className="w-5 h-5" />
                         </div>
                         <div>
                            <span className="block font-bold text-slate-900 dark:text-white mb-0.5">{project.nome}</span>
                            <span className="text-xs text-slate-500">{project.slug}</span>
                         </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        {project.codigo}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {project.ativo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ativo
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Inativo
                        </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{project._count.user_projects}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{project._count.rodovias}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link 
                        href={`/admin/projects/${project.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                     <p>Nenhum projeto cadastrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
