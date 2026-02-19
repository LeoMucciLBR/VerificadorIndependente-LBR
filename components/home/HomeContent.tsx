"use client";

import { useState } from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ProjectBanner } from "@/components/home/ProjectBanner";
import { ExecutionTimeline } from "@/components/home/ExecutionTimeline";
import { QuickStats } from "@/components/home/QuickStats";
import { HomeFooter } from "@/components/home/HomeFooter";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import GeolocationContent from "@/components/geolocalizacao/GeolocationContent";
import ExecucoesView from "@/components/execucoes/ExecucoesView";
import RegistrosView from "@/components/registros/RegistrosView";

type HomeContentProps = {
  projectInfo: any;
  user: any;
  dashboardCards: any[];
  executions: any[];
  fases: any[];
  rodovias: any[];
  registrosData?: {
    ocorrencias: any[];
    pagination: any;
    activeInspection: any;
    indicadores: any[];
    projectSlug?: string;
  };
};

export function HomeContent({ projectInfo, user, dashboardCards, executions, fases, rodovias, registrosData }: HomeContentProps) {
  const [activeTab, setActiveTab] = useState("sintese");

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="road-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="2" strokeDasharray="10,15" />
            </pattern>
          </defs>
          <rect fill="url(#road-pattern)" width="100%" height="100%" className="text-foreground" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <HomeHeader activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        
        {activeTab === "sintese" ? (
          <main className="flex-1">
            <ProjectBanner data={projectInfo} />
            <ExecutionTimeline executions={dashboardCards} />
            <QuickStats />
            <HomeFooter />
          </main>
        ) : activeTab === "execution_list" ? (
          <main className="flex-1 flex flex-col min-h-[calc(100vh-64px)]">
             <ExecucoesView executions={executions} fases={fases} rodovias={rodovias} />
          </main>
        ) : activeTab === "report" ? (
          <main className="flex-1">
            <div className="container mx-auto px-4 sm:px-6 py-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Relatório</h2>
              <p className="text-foreground/60">Conteúdo de relatórios em desenvolvimento...</p>
            </div>
          </main>
        ) : activeTab === "geolocation" ? (
          <main className="flex-1 flex flex-col h-[calc(100vh-80px)]">
            <GeolocationContent />
          </main>
        ) : activeTab === "records" ? (
          <main className="flex-1 flex flex-col min-h-[calc(100vh-64px)]">
            <RegistrosView 
                ocorrencias={registrosData?.ocorrencias || []} 
                pagination={registrosData?.pagination || { total: 0, pages: 1, current: 1 }}
                activeInspection={registrosData?.activeInspection}
                indicadores={registrosData?.indicadores || []}
                projectSlug={registrosData?.projectSlug || ""}
            />
          </main>
        ) : activeTab === "documentation" ? (
          <main className="flex-1">
             <div className="container mx-auto px-4 sm:px-6 py-12">
               <h2 className="text-3xl font-bold text-foreground mb-6">Documentação</h2>
               <p className="text-foreground/60">Área de documentação em desenvolvimento...</p>
             </div>
          </main>
        ) : (
          <SettingsLayout />
        )}
      </div>
    </div>
  );
}
