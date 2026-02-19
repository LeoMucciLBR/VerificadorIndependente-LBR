"use client";

import { useState, useTransition } from "react";
import { Search, MoreVertical, UserCheck, UserX, Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { deleteUser, toggleUserStatus } from "@/app/admin/users/actions";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

export function UserTable({ users, onEdit }: UserTableProps) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortBy === "createdAt") {
      return sortOrder === "asc" 
        ? new Date(aValue as Date).getTime() - new Date(bValue as Date).getTime()
        : new Date(bValue as Date).getTime() - new Date(aValue as Date).getTime();
    }
    
    const aString = String(aValue || "");
    const bString = String(bValue || "");
    return sortOrder === "asc" 
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.success) {
        alert(result.error || "Erro ao excluir usuário");
      }
    });
  };

  const handleToggleStatus = async (userId: string) => {
    startTransition(async () => {
      const result = await toggleUserStatus(userId);
      if (!result.success) {
        alert(result.error || "Erro ao alterar status");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou função..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-white/5">
            <tr>
              <th 
                className="pb-3 px-4 font-semibold text-gray-700 dark:text-slate-200 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("name")}
              >
                Nome {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th 
                className="pb-3 px-4 font-semibold text-gray-700 dark:text-slate-200 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("email")}
              >
                Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th 
                className="pb-3 px-4 font-semibold text-gray-700 dark:text-slate-200 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("role")}
              >
                Função {sortBy === "role" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th 
                className="pb-3 px-4 font-semibold text-gray-700 dark:text-slate-200 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort("createdAt")}
              >
                Criado em {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="pb-3 px-4 font-semibold text-gray-700 dark:text-slate-200">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5">
            {sortedUsers.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user.name || "Sem nome"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                  {user.email}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    user.role === "ADMIN" 
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(user)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-slate-400 hover:text-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(user.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-slate-400 hover:text-amber-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                      title="Desativar"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id, user.name || user.email)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-slate-400 hover:text-red-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-slate-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Mostrando <span className="font-medium text-gray-900 dark:text-white">{sortedUsers.length}</span> de <span className="font-medium text-gray-900 dark:text-white">{users.length}</span> usuários
        </p>
      </div>
    </div>
  );
}
