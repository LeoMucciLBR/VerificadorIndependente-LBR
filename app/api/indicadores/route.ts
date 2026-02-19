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
    const projectId = searchParams.get("projectId");
    const grupoId = searchParams.get("grupoId");
    const areaAtuacao = searchParams.get("areaAtuacao");

    const where: any = {};

    if (grupoId) {
      where.grupo_id = BigInt(grupoId);
    }

    // Filter by project via grupo relation
    if (projectId && !grupoId) {
      where.grupos = {
        project_id: BigInt(projectId)
      };
    }

    if (areaAtuacao) {
      where.areaAtuacao = areaAtuacao;
    }

    const indicadores = await prisma.indicador.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        nome: true,
        descricao: true,
        sigla: true,
        unidadeMedida: true,
        areaAtuacao: true,
        requer_medicao: true,
        valor_meta: true,
        createdAt: true,
        updatedAt: true,
        grupos: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            peso: true,
          },
        },
      },
      orderBy: [
        { grupos: { nome: "asc" } },
        { nome: "asc" }
      ],
    });

    // Serialize BigInt to string
    const serialized = indicadores.map((ind) => ({
      id: ind.id.toString(),
      uuid: ind.uuid,
      nome: ind.nome,
      descricao: ind.descricao,
      sigla: ind.sigla,
      unidadeMedida: ind.unidadeMedida,
      areaAtuacao: ind.areaAtuacao,
      requerMedicao: ind.requer_medicao,
      valorMeta: ind.valor_meta ? Number(ind.valor_meta) : null,
      createdAt: ind.createdAt.toISOString(),
      updatedAt: ind.updatedAt.toISOString(),
      grupo: {
        id: ind.grupos.id.toString(),
        nome: ind.grupos.nome,
        sigla: ind.grupos.sigla,
        peso: Number(ind.grupos.peso),
      },
    }));

    return NextResponse.json({ indicadores: serialized });
  } catch (error: any) {
    console.error("Error fetching indicadores:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar indicadores" },
      { status: 500 }
    );
  }
}
