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
    const indicadorId = searchParams.get("indicadorId");
    const tipoRetorno = searchParams.get("tipoRetorno");

    const where: any = {};

    if (indicadorId) {
      where.indicador_id = BigInt(indicadorId);
    }

    if (tipoRetorno) {
      where.tipoRetorno = tipoRetorno;
    }

    const caracterizacoes = await prisma.caracterizacao.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        descricao: true,
        regulamentacao: true,
        tipoRetorno: true,
        createdAt: true,
        updatedAt: true,
        indicadores: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            unidadeMedida: true,
          },
        },
        caracterizacoes_fases: {
          select: {
            fases: {
              select: {
                id: true,
                nome: true,
                dataInicio: true,
                dataFim: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize BigInt to string
    const serialized = caracterizacoes.map((car) => ({
      id: car.id.toString(),
      uuid: car.uuid,
      descricao: car.descricao,
      regulamentacao: car.regulamentacao,
      tipoRetorno: car.tipoRetorno,
      createdAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt.toISOString(),
      indicador: {
        id: car.indicadores.id.toString(),
        nome: car.indicadores.nome,
        sigla: car.indicadores.sigla,
        unidadeMedida: car.indicadores.unidadeMedida,
      },
      fases: car.caracterizacoes_fases.map((cf) => ({
        id: cf.fases.id.toString(),
        nome: cf.fases.nome,
        dataInicio: cf.fases.dataInicio.toISOString(),
        dataFim: cf.fases.dataFim.toISOString(),
        isActive: cf.fases.isActive,
      })),
    }));

    return NextResponse.json({ caracterizacoes: serialized });
  } catch (error: any) {
    console.error("Error fetching caracterizacoes:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar caracterizações" },
      { status: 500 }
    );
  }
}
