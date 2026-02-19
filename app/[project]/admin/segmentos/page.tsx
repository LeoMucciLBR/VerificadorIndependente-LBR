import prisma from "@/lib/prisma";
import { Layers, MapPin } from "lucide-react";
import SegmentosAdminClient from "@/components/admin/SegmentosAdminClient";

export default async function SegmentosAdminPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const segmentos = await prisma.segmentoHomogeneo.findMany({
    orderBy: [{ rodovia_id: "asc" }, { kmInicial: "asc" }],
    include: {
      rodovias: {
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      },
    },
  });

  // Serialize BigInt
  const serializedSegmentos = segmentos.map((s) => ({
    id: String(s.id),
    uuid: s.uuid,
    nome: s.nome,
    kmInicial: Number(s.kmInicial),
    kmFinal: Number(s.kmFinal),
    rodovia: {
      id: String(s.rodovias.id),
      nome: s.rodovias.nome,
      codigo: s.rodovias.codigo,
    },
  }));

  return (
    <SegmentosAdminClient project={project} initialSegmentos={serializedSegmentos} />
  );
}
