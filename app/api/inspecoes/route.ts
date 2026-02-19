import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const rodoviaId = searchParams.get("rodoviaId");
    const faseId = searchParams.get("faseId");
    const status = searchParams.get("status");
    const isOfficial = searchParams.get("isOfficial");
    const limit = searchParams.get("limit");

    const where: any = {};

    if (rodoviaId) {
      where.rodovia_id = BigInt(rodoviaId);
    }

    if (faseId) {
      where.fase_id = BigInt(faseId);
    }

    if (status) {
      where.status = status;
    }

    if (isOfficial !== null && isOfficial !== undefined) {
      where.is_official = isOfficial === "true";
    }

    const inspecoes = await prisma.inspecao.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        periodoReferencia: true,
        dataInicioVistoria: true,
        dataFimVistoria: true,
        descricaoVistoria: true,
        sincronizado: true,
        status: true,
        nota: true,
        is_official: true,
        assinatura_caminho: true,
        createdAt: true,
        updatedAt: true,
        rodovias: {
          select: {
            id: true,
            uuid: true,
            nome: true,
            codigo: true,
            concessionaria: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        fase: {
          select: {
            id: true,
            uuid: true,
            nome: true,
            dataInicio: true,
            dataFim: true,
            isActive: true,
          },
        },
        inspecoes_responsaveis: {
          select: {
            papel: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            ocorrencias: true,
            inspection_locations: true,
          },
        },
      },
      orderBy: {
        dataInicioVistoria: "desc",
      },
      take: limit ? parseInt(limit) : undefined,
    });

    // Serialize BigInt to string
    const serialized = inspecoes.map((insp) => ({
      id: insp.id.toString(),
      uuid: insp.uuid,
      periodoReferencia: insp.periodoReferencia.toISOString(),
      dataInicioVistoria: insp.dataInicioVistoria.toISOString(),
      dataFimVistoria: insp.dataFimVistoria.toISOString(),
      descricaoVistoria: insp.descricaoVistoria,
      sincronizado: insp.sincronizado,
      status: insp.status,
      nota: insp.nota ? Number(insp.nota) : null,
      isOfficial: insp.is_official,
      assinaturaCaminho: insp.assinatura_caminho,
      createdAt: insp.createdAt.toISOString(),
      updatedAt: insp.updatedAt.toISOString(),
      rodovia: {
        id: insp.rodovias.id.toString(),
        uuid: insp.rodovias.uuid,
        nome: insp.rodovias.nome,
        codigo: insp.rodovias.codigo,
        concessionaria: insp.rodovias.concessionaria,
      },
      usuario: {
        id: insp.users.id.toString(),
        name: insp.users.name || "Usuário sem nome",
        email: insp.users.email,
      },
      fase: insp.fase ? {
        id: insp.fase.id.toString(),
        uuid: insp.fase.uuid,
        nome: insp.fase.nome,
        dataInicio: insp.fase.dataInicio.toISOString(),
        dataFim: insp.fase.dataFim.toISOString(),
        isActive: insp.fase.isActive,
      } : null,
      responsaveis: insp.inspecoes_responsaveis.map((resp) => ({
        papel: resp.papel,
        usuario: {
          id: resp.users.id.toString(),
          name: resp.users.name || "Usuário sem nome",
          email: resp.users.email,
        },
      })),
      stats: {
        totalOcorrencias: insp._count.ocorrencias,
        totalLocalizacoes: insp._count.inspection_locations,
      },
    }));

    return NextResponse.json({ 
      inspecoes: serialized,
      total: serialized.length 
    });
  } catch (error: any) {
    console.error("Error fetching inspecoes:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar inspeções" },
      { status: 500 }
    );
  }
}
