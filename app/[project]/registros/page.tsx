import { getOcorrencias, getActiveInspection, getIndicadoresForSelect } from "@/app/actions/ocorrencias";
import RegistrosView from "@/components/registros/RegistrosView";

type Props = {
  params: Promise<{ project: string }>;
};

export default async function RegistrosPage({ params }: Props) {
  const { project } = await params;
  
  const [ocorrenciasRes, activeInspectionRes, indicadoresSelectRes] = await Promise.all([
    getOcorrencias(1, 50, project),
    getActiveInspection(project),
    getIndicadoresForSelect(),
  ]);

  const ocorrencias = (ocorrenciasRes.success && ocorrenciasRes.data) ? ocorrenciasRes.data : [];
  const ocorrenciasPagination = (ocorrenciasRes.success && ocorrenciasRes.pagination) ? ocorrenciasRes.pagination : { total: 0, pages: 1, current: 1 };
  
  const activeInspection = (activeInspectionRes.success && activeInspectionRes.data) ? activeInspectionRes.data : null;
  const indicadoresSelect = (indicadoresSelectRes.success && indicadoresSelectRes.data) ? indicadoresSelectRes.data : [];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        <RegistrosView 
            ocorrencias={ocorrencias} 
            pagination={ocorrenciasPagination}
            activeInspection={activeInspection}
            indicadores={indicadoresSelect}
            projectSlug={project}
        />
    </div>
  );
}
