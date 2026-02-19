"use client";

import { useState } from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ProjectBanner } from "@/components/home/ProjectBanner";
import { ExecutionTimeline } from "@/components/home/ExecutionTimeline";
import { QuickStats } from "@/components/home/QuickStats";
import { HomeFooter } from "@/components/home/HomeFooter";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import GeolocationView from "@/components/geolocation/GeolocationView";
import dynamic from "next/dynamic";

const ModernHighway = dynamic(() => import("@/components/ModernHighway"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0e1a]" />,
});

export function ModernHomeContent({ projectInfo, user, dashboardCards }: { projectInfo: any, user: any, dashboardCards: any[] }) {
  const [activeTab, setActiveTab] = useState("execution");

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <ModernHighway />
      </div>

      {/* Glassmorphism Overlay */}
      <div className="fixed inset-0 z-0 bg-navy/80 backdrop-blur-[2px]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <HomeHeader activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        
        {activeTab === "execution" ? (
          <main className="flex-1">
            {/* 
                We can make the ProjectBanner transparent to show the highway behind it using glassmorphism.
                For now using existing components but they will sit on top of the blurred 3D scene.
            */}
            <div className="relative">
                <ProjectBanner data={projectInfo} />
            </div>
            
            <div className="bg-navy/50 backdrop-blur-md">
                <ExecutionTimeline executions={dashboardCards} />
                <QuickStats />
                <HomeFooter />
            </div>
          </main>
        ) : activeTab === "report" ? (
          <main className="flex-1 bg-navy/50 backdrop-blur-md">
            <div className="container mx-auto px-4 sm:px-6 py-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Relatório</h2>
              <p className="text-foreground/60">Conteúdo de relatórios em desenvolvimento...</p>
            </div>
          </main>
        ) : activeTab === "geolocation" ? (
          <main className="flex-1">
            <GeolocationView />
          </main>
        ) : activeTab === "records" ? (
          <main className="flex-1 bg-navy/50 backdrop-blur-md">
            <div className="container mx-auto px-4 sm:px-6 py-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Registros</h2>
              <p className="text-foreground/60">Conteúdo de registros em desenvolvimento...</p>
            </div>
          </main>
        ) : (
          <div className="bg-navy/95 backdrop-blur-xl min-h-screen">
            <SettingsLayout />
          </div>
        )}
      </div>
    </div>
  );
}
