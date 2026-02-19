"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, User, Mail, Building2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserModal } from "./UserModal";
import { getUsers, createUser, updateUser, deleteUser } from "@/app/actions/users";
import { getInstitutions } from "@/app/actions/institutions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RoleValue } from "@/types/enums";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: RoleValue;
  instituicaoId?: string | null;
  podeCadastrar: boolean;
  instituicao?: { nome: string } | null;
  createdAt: Date;
}

interface InstitutionOption {
  id: string;
  nome: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  user: "Usuário Padrão",
  guest: "Visitante",
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  USER: "Usuário Padrão",
  GUEST: "Visitante",
  AUDITOR: "Auditor"
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/20",
  ADMIN: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-500/20",
  USER: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/20",
  AUDITOR: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20",
  GUEST: "bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:border-zinc-500/20",
};

export function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [usersResult, instResult] = await Promise.all([
        getUsers(),
        getInstitutions()
    ]);

    if (usersResult.success && usersResult.data) {
        // @ts-ignore - Prisma client outdated
        setUsers(usersResult.data);
    } else {
        toast.error("Erro ao carregar usuários");
    }

    if (instResult.success && instResult.data) {
        setInstitutions(instResult.data as InstitutionOption[]);
    }

    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    const result = await deleteUser(id);
    if (result.success) {
      toast.success("Usuário excluído com sucesso");
      setUsers(prev => prev.filter(u => u.id !== id));
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    if (editingUser) {
      result = await updateUser(editingUser.id, formData);
    } else {
      result = await createUser(formData);
    }

    if (result.success) {
      toast.success(editingUser ? "Atualizado com sucesso!" : "Criado com sucesso!");
      setIsModalOpen(false);
      loadData(); // Re-fetch to ensure sync
    } else {
      toast.error(result.error || "Erro ao salvar");
    }
    setIsSaving(false);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.instituicao?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <User className="w-8 h-8 text-indigo-500" />
            </div>
            Gestão de Usuários
          </h1>
          <p className="text-foreground/60 text-lg max-w-2xl">
            Gerencie acesso e permissões dos colaboradores.
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/25 transition-all gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

       {/* Search Bar */}
       <div className="w-full relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-foreground/30" />
          </div>
          <input
            type="text"
            placeholder="Buscar usuário, email ou instituição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-foreground"
          />
      </div>

      {/* Content */}
      <div className="w-full">
        {isLoading ? (
             <div className="flex flex-col items-center justify-center p-12 text-foreground/50 gap-3 border border-border/10 rounded-xl bg-white dark:bg-white/5">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Carregando usuários...</p>
             </div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                {filteredUsers.map((user) => (
                    <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-white/5 border border-border/10 dark:border-border/50 rounded-xl p-5 shadow-sm hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gradient-to-l from-white via-white to-transparent dark:from-zinc-900 dark:via-zinc-900">
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8 hover:bg-indigo-500/20 hover:text-indigo-500">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-foreground/50 text-lg font-bold">
                                {user.name?.[0]?.toUpperCase() || <User />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate" title={user.name || ""}>{user.name}</h3>
                                <div className="text-sm text-foreground/50 truncate flex items-center gap-1.5" title={user.email}>
                                <Mail className="w-3 h-3 shrink-0" />
                                {user.email}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-border/10">
                            <div className="flex items-center justify-between">
                                <span className={cn("text-xs font-medium px-2 py-0.5 rounded border", ROLE_COLORS[user.role] || ROLE_COLORS.USER)}>
                                    {ROLE_LABELS[user.role] || user.role}
                                </span>
                                {user.podeCadastrar && (
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Cadastra
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-foreground/70">
                                <Building2 className="w-4 h-4 text-foreground/40" />
                                <span className="truncate">{user.instituicao?.nome || "Sem vínculo institucional"}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
             </div>
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        // @ts-ignore
        initialData={editingUser}
        institutions={institutions}
        isLoading={isSaving}
      />
    </div>
  );
}
