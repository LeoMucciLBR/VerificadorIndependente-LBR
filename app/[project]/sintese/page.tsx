import { getProjectSettings } from "@/app/actions/settings";
import { getTimelineExecutions } from "@/app/actions/home";
import { ProjectBanner } from "@/components/home/ProjectBanner";
import { ExecutionTimeline } from "@/components/home/ExecutionTimeline";
import { QuickStats } from "@/components/home/QuickStats";
import { HomeFooter } from "@/components/home/HomeFooter";

interface SintesePageProps {
  params: Promise<{ project: string }>;
}

export default async function SintesePage({ params }: SintesePageProps) {
  const { project: projectSlug } = await params;

  const [projectInfo, executionsResult] = await Promise.all([
    getProjectSettings(),
    getTimelineExecutions(projectSlug),
  ]);

  const mockProjectInfo = {
    title: "Concessão Rodovia ViaBrasil - Lote 1",
    heroImageUrl: "https://images.unsplash.com/photo-1596529897658-912c7bb2a00c?q=80&w=2070&auto=format&fit=crop",
    contractNumber: "CTR-249/2023 - ANTT",
    clientName: "Agência Nacional de Transportes Terrestres",
    segmentName: "Trecho Sul - BR-163 / BR-364",
    extension: "850,4 km",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2053-01-01")
  };

  const finalProjectInfo = (projectInfo && projectInfo.id) ? projectInfo : mockProjectInfo;
  const executions = executionsResult.data || [];

  return (
    <div className="flex-1">
        <ProjectBanner data={finalProjectInfo} />
        <ExecutionTimeline executions={executions} />
        <QuickStats />
        <HomeFooter />
    </div>
  );
}
