'use client';

import { useState } from "react";
import { Plus, Trash2, Building2, Shield, BarChart3, Users, CheckCircle } from "lucide-react";
import { assignUserToProject, removeUserFromProject } from "@/app/admin/users/actions";
import { useRouter } from "next/navigation";

interface Project {
  id: bigint;
  nome: string;
  codigo: string;
}

interface UserProject {
  project_id: bigint;
  papel: 'ADMIN' | 'FISCAL' | 'CONSULTA' | null;
  projects?: Project; 
  // Prisma include might return projects relation if we ask for it
}

interface Props {
  userId: bigint;
  assignments: any[]; // refined type below
  allProjects: Project[];
}

export function UserProjectManager({ userId, assignments, allProjects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<'FISCAL' | 'ADMIN' | 'CONSULTA'>("FISCAL");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Filter out projects already assigned
  const assignedProjectIds = new Set(assignments.map(a => String(a.project_id)));
  const availableProjects = allProjects.filter(p => !assignedProjectIds.has(String(p.id)));

  async function handleAdd() {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
        await assignUserToProject(userId, BigInt(selectedProjectId), selectedRole);
        setSelectedProjectId(""); // Reset
        alert("Projeto vinculado com sucesso!");
    } catch (error) {
        alert("Erro ao vincular projeto.");
    } finally {
        setLoading(false);
    }
  }

  async function handleRemove(projectId: bigint) {
    if (!confirm("Tem certeza que deseja remover este acesso?")) return;
    try {
        await removeUserFromProject(userId, projectId);
    } catch (error) {
        alert("Erro ao remover projeto.");
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Projetos Vinculados
          </h3>
       </div>
       
       {/* List of Assigned Projects */}
       <div className="space-y-3">
          {assignments.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm italic">Nenhum projeto vinculado a este usuário.</p>
          ) : (
             assignments.map((assignment) => (
                <div key={String(assignment.project_id)} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400">
                             <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block font-bold text-slate-900 dark:text-white text-sm">
                                {assignment.projects?.nome || "Projeto Desconhecido"}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono text-slate-400">{assignment.projects?.codigo}</span>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                    assignment.papel === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                    assignment.papel === 'FISCAL' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                                }`}>
                                   {assignment.papel}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => handleRemove(assignment.project_id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remover acesso"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
             ))
          )}
       </div>

       {/* Add New Project */}
       <div className="pt-4 border-t border-slate-200/50 dark:border-white/5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Adicionar Novo Vínculo</label>
          <div className="flex flex-col sm:flex-row gap-3">
             <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-medium"
             >
                <option value="">Selecione um projeto...</option>
                {availableProjects.map(p => (
                    <option key={String(p.id)} value={String(p.id)}>{p.nome} ({p.codigo})</option>
                ))}
             </select>

             <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full sm:w-40 px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-medium"
             >
                <option value="FISCAL">Fiscal</option>
                <option value="ADMIN">Admin</option>
                <option value="CONSULTA">Consulta</option>
             </select>

             <button 
                onClick={handleAdd}
                disabled={!selectedProjectId || loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
             >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
             </button>
          </div>
       </div>
    </div>
  );
}
