'use client';

import { updateUser } from "@/app/admin/users/actions";
import { User, Save, ArrowLeft, Mail, Lock, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProjectManager } from "@/components/admin/UserProjectManager";

interface Project {
    id: bigint;
    nome: string;
    codigo: string;
}

interface UserProps {
    id: bigint;
    name: string | null;
    email: string;
    role: any;
    isActive: boolean;
    user_projects: any[];
}

interface Props {
    user: UserProps;
    allProjects: Project[];
}

export default function EditUserClient({ user, allProjects }: Props) {
  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await updateUser(user.id.toString(), formData);
      setChangePassword(false); // Reset password field view
    } catch (error) {
      alert("Erro ao atualizar usuário.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Link 
                href="/admin/users"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Editar Usuário</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Gerencie dados e acessos.</p>
            </div>
        </div>
        
        {/* Placeholder for Delete Button */}
        <button 
            type="button"
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Excluir usuário (Em breve)"
        >
            <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl overflow-hidden p-8">
        <form action={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                    Dados Cadastrais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                name="name"
                                type="text" 
                                required
                                defaultValue={user.name || ''}
                                placeholder="Ex: Ana Silva"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                name="email"
                                type="email" 
                                required
                                defaultValue={user.email}
                                placeholder="Ex: ana@viabrasil.com"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Papel (Role)</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select 
                                name="role"
                                required
                                defaultValue={user.role}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                            >
                                <option value="USER">Usuário Comum</option>
                                <option value="AUDITOR">Auditor</option>
                                <option value="ADMIN">Administrador</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Senha</label>
                            <button 
                                type="button" 
                                onClick={() => setChangePassword(!changePassword)}
                                className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                            >
                                {changePassword ? "Cancelar alteração" : "Alterar senha"}
                            </button>
                         </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                name="password"
                                type="password" 
                                disabled={!changePassword}
                                placeholder={changePassword ? "Nova senha" : "••••••••"}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 flex items-center pt-4 md:col-span-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isActive" defaultChecked={user.isActive} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Conta Ativa</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-b border-slate-200 dark:border-white/10 pb-8">
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
                    Salvar Alterações
                </button>
            </div>
        </form>

        {/* Project Assignments */}
        <div className="mt-8">
            <UserProjectManager 
                userId={user.id} 
                assignments={user.user_projects} 
                allProjects={allProjects} 
            />
        </div>
      </div>
    </div>
  );
}
