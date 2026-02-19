import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Settings, Map, FileText } from "lucide-react";
import Link from "next/link";

export default async function ConfiguracoesAdminPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const sections = [
    {
      icon: Settings,
      title: "Configurações Gerais",
      description: "Editar informações do projeto, datas e detalhes contratuais",
      href: `/${project}/settings`,
      color: "purple",
    },
    {
      icon: Map,
      title: "Geolocalização",
      description: "Upload de arquivos KMZ e gerenciamento de rotas",
      href: `/${project}/geolocalizacao`,
      color: "blue",
    },
    {
      icon: FileText,
      title: "Rodovias & Segmentos",
      description: "Gerenciar rodovias e segmentos homogêneos",
      href: `/${project}/admin/rodovias`,
      color: "emerald",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Configurações do Projeto
        </h1>
        <p className="text-slate-400">
          Acesso centralizado às configurações e ferramentas administrativas
        </p>
      </div>

      {/* Configuration Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${section.color}-500/10 flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-6 h-6 text-${section.color}-500`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-400">{section.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
          <span>ℹ️</span> Informação
        </h3>
        <p className="text-slate-300 text-sm">
          <strong>Configurações Gerais</strong> permite editar informações básicas do projeto.
          <br />
          <strong>Geolocalização</strong> gerencia uploads de KMZ e visualização de mapas (futuramente será restrito ao admin).
          <br />
          <strong>Rodovias & Segmentos</strong> oferece gerenciamento completo das rodovias cadastradas.
        </p>
      </div>
    </div>
  );
}
