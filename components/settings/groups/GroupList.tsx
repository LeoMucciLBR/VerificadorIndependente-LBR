"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ChevronDown, Users, Loader2, BarChart3, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupModal } from "./GroupModal";
import { getGroups, createGroup, updateGroup, deleteGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SettingsPageLayout } from "../shared/SettingsPageLayout";

interface Group {
  id: string;
  nome: string;
  sigla: string;
  peso: number;
  grupoPai_id?: string | null;
  grupoPai?: { nome: string } | null;
  _count?: { other_grupos: number, indicadores: number };
  children?: Group[];
}

export function GroupList() {
  const [flatGroups, setFlatGroups] = useState<Group[]>([]);
  const [groupTree, setGroupTree] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    const result = await getGroups();
    if (result.success && result.data) {
      const groups = result.data.map((g: any) => ({
        ...g,
        peso: Number(g.peso)
      }));
      setFlatGroups(groups);
      setGroupTree(buildGroupTree(groups));
      
      const rootIds = groups.filter((g: any) => !g.grupoPai_id).map((g: any) => g.id);
      setExpandedGroups(new Set(rootIds));
    } else {
      toast.error("Erro ao carregar grupos");
    }
    setIsLoading(false);
  };

  const buildGroupTree = (groups: Group[]): Group[] => {
    const groupMap = new Map<string, Group>();
    const tree: Group[] = [];
    groups.forEach(g => groupMap.set(g.id, { ...g, children: [] }));
    groups.forEach(g => {
      if (g.grupoPai_id && groupMap.has(g.grupoPai_id)) {
        groupMap.get(g.grupoPai_id)!.children!.push(groupMap.get(g.id)!);
      } else {
        tree.push(groupMap.get(g.id)!);
      }
    });
    return tree;
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedGroups(newExpanded);
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;
    const result = await deleteGroup(id);
    if (result.success) {
      toast.success("Grupo excluído com sucesso");
      loadGroups();
    } else {
      toast.error(result.error || "Erro ao excluir grupo");
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    let result;
    if (editingGroup) {
      result = await updateGroup(editingGroup.id, formData);
    } else {
      result = await createGroup(formData);
    }
    if (result.success) {
      toast.success(editingGroup ? "Grupo atualizado!" : "Grupo criado!");
      setIsModalOpen(false);
      loadGroups();
    } else {
      toast.error(result.error || "Erro ao salvar grupo");
    }
    setIsSaving(false);
  };

  const GroupItem = ({ group, level = 0 }: { group: Group, level?: number }) => {
    const hasChildren = group.children && group.children.length > 0;
    const isExpanded = expandedGroups.has(group.id);
    const isRoot = level === 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3"
        style={{ marginLeft: level > 0 ? `${level * 1.5}rem` : 0 }}
      >
        <div className={cn(
          "group relative overflow-hidden transition-all duration-300",
          isRoot 
            ? "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200/60 dark:border-slate-700/60"
            : "bg-white/40 dark:bg-slate-800/20 rounded-xl hover:bg-white dark:hover:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/40"
        )}>
          {/* Accent bar on left */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
            isRoot ? "bg-blue-600" : "bg-blue-400 opacity-0 group-hover:opacity-100"
          )} />

          <div className="p-5">
            <div className="flex items-center gap-4">
              {/* Expand button */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(group.id)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isExpanded ? "" : "-rotate-90"
                  )} />
                </button>
              )}

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={cn(
                    "font-bold text-slate-900 dark:text-white",
                    isRoot ? "text-xl" : "text-base"
                  )}>
                    {group.nome}
                  </h3>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wide">
                    {group.sigla}
                  </span>
                </div>

                {/* Stats pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                    <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      Peso {group.peso}
                    </span>
                  </div>

                  {(group._count?.other_grupos || 0) > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
                      <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        {group._count?.other_grupos} {group._count?.other_grupos === 1 ? 'subgrupo' : 'subgrupos'}
                      </span>
                    </div>
                  )}

                  {(group._count?.indicadores || 0) > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {group._count?.indicadores} {group._count?.indicadores === 1 ? 'indicador' : 'indicadores'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(group);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group.id);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-3"
            >
              {group.children!.map(child => (
                <GroupItem key={child.id} group={child} level={level + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <>
      <SettingsPageLayout
        title="Grupos de Trabalho"
        description="Gerencie a hierarquia organizacional e a estrutura de agrupamento dos indicadores."
        icon={Users}
        onNew={handleCreate}
        newLabel="Novo Grupo"
        stats={[
           { label: "Total de Grupos", value: flatGroups.length },
           { label: "Grupos Raiz", value: groupTree.length, trend: "Principais", trendUp: true },
           { label: "Subgrupos", value: flatGroups.length - groupTree.length, trend: "Derivados", trendUp: true }
        ]}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Carregando grupos...</p>
          </div>
        ) : flatGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Nenhum grupo cadastrado
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Crie o primeiro grupo para começar a organizar seus indicadores
              </p>
            </div>
            <Button 
              onClick={handleCreate} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeiro Grupo
            </Button>
          </div>
        ) : (
          <div>
            {groupTree.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <GroupItem group={group} />
              </motion.div>
            ))}
          </div>
        )}
      </SettingsPageLayout>

      <GroupModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingGroup}
        availableParents={flatGroups.filter(g => g.id !== editingGroup?.id)}
        isLoading={isSaving}
      />
    </>
  );
}
