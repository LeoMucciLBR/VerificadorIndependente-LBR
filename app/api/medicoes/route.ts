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
    const faseId = searchParams.get("faseId");
    const indicadorId = searchParams.get("indicadorId");
    const competencia = searchParams.get("competencia");
    const status = searchParams.get("status");

    const where: any = {};

    if (faseId) {
      where.fase_id = BigInt(faseId);
    }

    if (indicadorId) {
      where.indicador_id = BigInt(indicadorId);
    }

    if (competencia) {
      where.competencia = new Date(competencia);
    }

    if (status) {
      where.status = status;
    }

    const medicoes = await prisma.medicao.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        competencia: true,
        valor: true,
        observacoes: true,
        status: true,
        criadoEm: true,
        atualizadoEm: true,
        indicadores: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            unidadeMedida: true,
            valor_meta: true,
          },
        },
        fases: {
          select: {
            id: true,
            uuid: true,
            nome: true,
            dataInicio: true,
            dataFim: true,
            isActive: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { competencia: "desc" },
        { criadoEm: "desc" }
      ],
    });

    // Serialize BigInt to string
    const serialized = medicoes.map((med) => ({
      id: med.id.toString(),
      uuid: med.uuid,
      competencia: med.competencia.toISOString().split('T')[0], // Only date
      valor: med.valor,
      observacoes: med.observacoes,
      status: med.status,
      criadoEm: med.criadoEm.toISOString(),
      atualizadoEm: med.atualizadoEm.toISOString(),
      indicador: {
        id: med.indicadores.id.toString(),
        nome: med.indicadores.nome,
        sigla: med.indicadores.sigla,
        unidadeMedida: med.indicadores.unidadeMedida,
        valorMeta: med.indicadores.valor_meta ? Number(med.indicadores.valor_meta) : null,
      },
      fase: {
        id: med.fases.id.toString(),
        uuid: med.fases.uuid,
        nome: med.fases.nome,
        dataInicio: med.fases.dataInicio.toISOString(),
        dataFim: med.fases.dataFim.toISOString(),
        isActive: med.fases.isActive,
      },
      criadoPor: {
        id: med.users.id.toString(),
        name: med.users.name || "Usuário sem nome",
        email: med.users.email,
      },
    }));

    return NextResponse.json({ medicoes: serialized });
  } catch (error: any) {
    console.error("Error fetching medicoes:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar medições" },
      { status: 500 }
    );
  }
}
