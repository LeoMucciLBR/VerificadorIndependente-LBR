import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { LayoutDashboard, Users, Building2, Database } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session || session.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  // Buscar estatísticas globais
  const [projectCount, userCount, rodoviaCount] = await Promise.all([
    prisma.projects.count(),
    prisma.user.count(),
    prisma.rodovia.count(),
  ]);

  const stats = [
    { icon: Building2, label: "Projetos", value: projectCount, color: "blue" },
    { icon: Users, label: "Usuários", value: userCount, color: "emerald" },
    { icon: Database, label: "Rodovias", value: rodoviaCount, color: "purple" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Super Admin Dashboard
        </h1>
        <p className="text-slate-400">
          Visão geral do sistema ViaBrasil
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-500`} />
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/admin/projects"
            className="p-4 border border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-800 transition-colors"
          >
            <Building2 className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-white font-medium">Gerenciar Projetos</p>
            <p className="text-sm text-slate-400">
              Criar e editar projetos
            </p>
          </a>

          <a
            href="/admin/users"
            className="p-4 border border-slate-700 rounded-lg hover:border-emerald-500 hover:bg-slate-800 transition-colors"
          >
            <Users className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-white font-medium">Gerenciar Usuários</p>
            <p className="text-sm text-slate-400">
              Adicionar e atribuir usuários
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
