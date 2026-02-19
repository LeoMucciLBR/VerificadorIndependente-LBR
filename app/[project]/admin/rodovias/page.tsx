import prisma from "@/lib/prisma";
import { Map, Plus } from "lucide-react";
import Link from "next/link";

export default async function RodoviasAdminPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: projectSlug } = await params;

  // Get project data first
  const projectData = await prisma.projects.findFirst({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!projectData) {
    return <div>Projeto não encontrado</div>;
  }

  const rodovias = await prisma.rodovia.findMany({
    where: { project_id: projectData.id },
    orderBy: { nome: "asc" },
    include: {
      _count: {
        select: {
          segmentos_homogeneos: true,
        },
      },
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Gerenciar Rodovias
          </h1>
          <p className="text-slate-400">
            Visualize e gerencie as rodovias do projeto
          </p>
        </div>
        <Link
          href={`/${projectSlug}/admin/rodovias/nova`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Rodovia
        </Link>
      </div>

      {/* Rodovias List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Nome
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Código
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Concessionária
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Segmentos
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rodovias.map((rodovia) => (
              <tr key={rodovia.id.toString()} className="hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-blue-500" />
                    <span className="text-white font-medium">
                      {rodovia.nome}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {rodovia.codigo || "-"}
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {rodovia.concessionaria || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-medium">
                    {rodovia._count.segmentos_homogeneos}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/${projectSlug}/admin/rodovias/${rodovia.uuid}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {rodovias.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-slate-500">
                    Nenhuma rodovia cadastrada
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
