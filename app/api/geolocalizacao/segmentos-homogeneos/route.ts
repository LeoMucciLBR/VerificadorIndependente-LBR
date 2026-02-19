import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const rodoviaId = searchParams.get("rodoviaId");
    const projectSlug = searchParams.get("projectSlug");

    let activeProjectId: bigint | null = null;

    // Tentar obter projeto pelo slug primeiro
    if (projectSlug) {
      const project = await prisma.projects.findFirst({
        where: { slug: projectSlug },
        select: { id: true }
      });
      activeProjectId = project?.id ?? null;
    }
    
    // Fallback: tentar obter do ProjectInfo se não tiver slug
    if (!activeProjectId) {
      const projectInfo = await prisma.projectInfo.findFirst();
      activeProjectId = projectInfo?.project_id ?? null;
    }

    // Construir filtro: sempre filtrar por rodovias do projeto ativo
    const where: any = {};
    
    if (rodoviaId) {
      where.rodovia_id = BigInt(rodoviaId);
    } else if (activeProjectId) {
      // Primeiro buscar IDs das rodovias do projeto ativo
      const rodoviasDoProjeto = await prisma.rodovia.findMany({
        where: { project_id: activeProjectId },
        select: { id: true }
      });
      
      const rodoviaIds = rodoviasDoProjeto.map(r => r.id);
      
      if (rodoviaIds.length > 0) {
        where.rodovia_id = { in: rodoviaIds };
      }
    }

    const segmentos = await prisma.segmentoHomogeneo.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        nome: true,
        descricao: true,
        kmInicial: true,
        kmFinal: true,
        kmInicialKML: true,
        kmFinalKML: true,
        inicioTrecho: true,
        fimTrecho: true,
        rodovia_id: true,
        geojson: true, // IMPORTANTE: cada segmento tem seu próprio traçado!
        // Excluindo 'geom' explicitamente pois é Unsupported
        rodovias: {
          select: {
            id: true,
            uuid: true,
            nome: true,
            codigo: true,
          },
        },
      },
      orderBy: [
        { rodovia_id: "asc" },
        { kmInicial: "asc" },
      ],
    });


    // Serializar BigInt e Decimal para JSON
    const serialized = segmentos.map((seg) => {
      // Calcular KML automaticamente se não estiver preenchido
      // Usar kmInicio da rodovia como offset (ex: MT-343 começa no KM 229.19)
      let kmInicialKMLValue = seg.kmInicialKML ? Number(seg.kmInicialKML) : null;
      let kmFinalKMLValue = seg.kmFinalKML ? Number(seg.kmFinalKML) : null;
      
      // Se KML não está preenchido, tentar calcular usando kmInicio da rodovia
      // Isso será preenchido posteriormente no banco, por enquanto usar kmInicial como fallback
      
      return {
        id: seg.id.toString(),
        uuid: seg.uuid,
        nome: seg.nome,
        descricao: seg.descricao,
        kmInicial: Number(seg.kmInicial),
        kmFinal: Number(seg.kmFinal),
        kmInicialKML: kmInicialKMLValue,
        kmFinalKML: kmFinalKMLValue,
        inicioTrecho: seg.inicioTrecho,
        fimTrecho: seg.fimTrecho,
        geojson: seg.geojson, // Traçado próprio do segmento
        rodovia: {
          id: seg.rodovias.id.toString(),
          uuid: seg.rodovias.uuid,
          nome: seg.rodovias.nome,
          sigla: seg.rodovias.codigo ?? seg.rodovias.nome,
        },
      };
    });

    return NextResponse.json({ segmentos: serialized });
  } catch (error: any) {
    console.error("Error fetching segmentos homogeneos:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch segmentos" },
      { status: 500 }
    );
  }
}
