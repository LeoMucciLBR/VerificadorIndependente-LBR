import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Map, Layers, Users, Settings } from "lucide-react";
import Link from "next/link";

export default async function ProjectAdminPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { project: projectSlug } = await params;

  // Buscar estatísticas do projeto
  const [projectData, rodovias, segmentos] = await Promise.all([
    prisma.projects.findFirst({
      where: { slug: projectSlug },
      select: {
        id: true,
        nome: true,
        codigo: true,
        descricao: true,
      },
    }),
    // Count will be done after we get project_id
    Promise.resolve(0),
    Promise.resolve(0),
  ]);

  if (!projectData) {
    redirect("/");
  }

  // Now get actual counts filtered by project
  const [rodoviasCount, segmentosCount] = await Promise.all([
    prisma.rodovia.count({
      where: { project_id: projectData.id }
    }),
    prisma.segmentoHomogeneo.count({
      where: { rodovias: { project_id: projectData.id } }
    }),
  ]);

  const stats = [
    { icon: Map, label: "Rodovias", value: rodoviasCount, color: "blue", href: `/${projectSlug}/admin/rodovias` },
    { icon: Layers, label: "Segmentos Homogêneos", value: segmentosCount, color: "emerald", href: `/${projectSlug}/admin/segmentos` },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Admin: {projectData?.nome || projectSlug}
        </h1>
        <p className="text-slate-400">
          {projectData?.descricao || "Gerencie as configurações e dados do projeto"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
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
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/${projectSlug}/geolocalizacao`}
            className="p-4 border border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-800 transition-colors"
          >
            <Map className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-white font-medium">Geolocalização</p>
            <p className="text-sm text-slate-400">
              Gerenciar segmentos no mapa
            </p>
          </Link>

          <Link
            href={`/${projectSlug}/settings`}
            className="p-4 border border-slate-700 rounded-lg hover:border-purple-500 hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-white font-medium">Configurações</p>
            <p className="text-sm text-slate-400">
              Configurações do projeto
            </p>
          </Link>
        </div>
      </div>

      {/* Back to Project Link */}
      <div className="mt-8">
        <Link
          href={`/${projectSlug}`}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          ← Voltar ao Projeto
        </Link>
      </div>
    </div>
  );
}
