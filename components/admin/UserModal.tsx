"use client";

import { useState, useTransition } from "react";
import { X, Mail, Lock, User as UserIcon, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createUser, updateUser } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

export function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = user 
        ? await updateUser(user.id, formData)
        : await createUser(formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Ocorreu um erro");
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gradient-to-br dark:from-[#0a192f] dark:to-[#0f2642] border border-gray-200 dark:border-primary/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -z-0" />
              
              {/* Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user ? "Editar Usuário" : "Novo Usuário"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    {user ? "Atualize as informações do usuário" : "Cadastre um novo usuário no sistema"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 relative">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {/* Name Field */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      name="name"
                      defaultValue={user?.name || ""}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="João Silva"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      name="email"
                      defaultValue={user?.email || ""}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="joao@example.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Senha {!user && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      name="password"
                      required={!user}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder={user ? "Deixe em branco para não alterar" : "••••••••"}
                    />
                  </div>
                  {user && (
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1.5 ml-1">
                      Deixe em branco para manter a senha atual
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Função no Sistema
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                    <select
                      name="role"
                      defaultValue={user?.role || "USER"}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="USER">Usuário Padrão</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="AUDITOR">Auditor</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-slate-300 border-2 border-gray-200 dark:border-white/10 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      user ? "Salvar Alterações" : "Criar Usuário"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
