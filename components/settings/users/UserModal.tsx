"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Lock, Shield, Building2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleValue } from "@/types/enums";
import { cn } from "@/lib/utils";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: RoleValue;
  instituicaoId?: string | null;
  podeCadastrar: boolean;
}

interface InsitutionOption {
  id: string;
  nome: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: UserData | null;
  institutions: InsitutionOption[];
  isLoading?: boolean;
}

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "USER", label: "Usuário Padrão" },
  { value: "GUEST", label: "Visitante" }
];

export function UserModal({ isOpen, onClose, onSave, initialData, institutions, isLoading }: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [instituicaoId, setInstituicaoId] = useState("");
  const [podeCadastrar, setPodeCadastrar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setEmail(initialData?.email || "");
      setRole(initialData?.role || "USER");
      setInstituicaoId(initialData?.instituicaoId || "");
      setPodeCadastrar(initialData?.podeCadastrar || false);
      setPassword(""); // Reset password on open
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("role", role);
    formData.append("instituicaoId", instituicaoId);
    formData.append("podeCadastrar", String(podeCadastrar));
    
    if (password) {
      formData.append("password", password);
    }
    
    await onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-border/10 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/10 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {initialData ? "Editar Usuário" : "Novo Usuário"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-foreground/50 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Senha {initialData && <span className="text-xs text-foreground/40 font-normal">(Deixe em branco para manter)</span>}
                    </label>
                    <input
                      type="password"
                      required={!initialData}
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Perfil de Acesso
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Instituição
                    </label>
                    <select
                      value={instituicaoId}
                      onChange={(e) => setInstituicaoId(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="">Sem vínculo</option>
                      {institutions.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-lg border border-border/10">
                    <div 
                        className={cn(
                            "w-10 h-6 rounded-full p-1 cursor-pointer transition-colors relative",
                            podeCadastrar ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                        )}
                        onClick={() => setPodeCadastrar(!podeCadastrar)}
                    >
                        <motion.div 
                            className="bg-white w-4 h-4 rounded-full shadow-sm"
                            animate={{ x: podeCadastrar ? 16 : 0 }}
                        />
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-foreground">Permitir Cadastros</span>
                        <span className="block text-xs text-foreground/50">Usuário pode criar novos registros no sistema</span>
                    </div>
                </div>

                <div className="pt-4 flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="ghost" 
                    onClick={onClose}
                    className="hover:bg-zinc-100 dark:hover:bg-white/5 text-foreground/70"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  >
                    {isLoading ? "Salvando..." : (initialData ? "Atualizar" : "Salvar Usuário")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
