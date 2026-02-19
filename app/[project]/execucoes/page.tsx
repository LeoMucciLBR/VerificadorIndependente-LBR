import { getExecutions, getFases, getRodoviasWithSegments } from "@/app/actions/execucoes";
import ExecucoesView from "@/components/execucoes/ExecucoesView";
import { getProjectBySlug } from "@/lib/project-context";

export default async function ExecucoesPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: projectSlug } = await params;
  
  // Get the actual project ID from slug
  const project = await getProjectBySlug(projectSlug);
  const projectId = project?.id ? String(project.id) : null;
  
  const [executionsRes, fasesRes, rodoviasRes] = await Promise.all([
    getExecutions(projectSlug),
    getFases(),
    getRodoviasWithSegments(projectId),
  ]);

  const executions = executionsRes.success ? executionsRes.data ?? [] : [];
  const fases = fasesRes.success ? fasesRes.data ?? [] : [];
  const rodovias = rodoviasRes.success ? rodoviasRes.data ?? [] : [];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        <ExecucoesView executions={executions} fases={fases} rodovias={rodovias} />
    </div>
  );
}
