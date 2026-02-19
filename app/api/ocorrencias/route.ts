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
    const inspecaoId = searchParams.get("inspecaoId");
    const indicadorId = searchParams.get("indicadorId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    const where: any = {};

    if (inspecaoId) {
      where.inspecao_id = BigInt(inspecaoId);
    }

    if (indicadorId) {
      where.indicador_id = BigInt(indicadorId);
    }

    if (status) {
      where.status = status;
    }

    const ocorrencias = await prisma.ocorrencia.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        dataHoraOcorrencia: true,
        lado: true,
        pistaFaixa: true,
        anotacoes: true,
        status: true,
        valor_medido: true,
        unidade_medida: true,
        dentro_do_limite: true,
        registroReferenteA: true,
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
        inspecoes: {
          select: {
            id: true,
            uuid: true,
            periodoReferencia: true,
            status: true,
            rodovias: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },
          },
        },
        ocorrencias_fotos: {
          select: {
            id: true,
            uuid: true,
            caminhoArquivo: true,
            latitude: true,
            longitude: true,
            dataHoraFoto: true,
            ordem: true,
          },
          orderBy: {
            ordem: "asc",
          },
        },
        ocorrencias_trechos: {
          select: {
            id: true,
            uuid: true,
            kmInicial: true,
            kmFinal: true,
            ordem: true,
            segmentos_homogeneos: {
              select: {
                id: true,
                nome: true,
                kmInicial: true,
                kmFinal: true,
              },
            },
          },
          orderBy: {
            ordem: "asc",
          },
        },
      },
      orderBy: {
        dataHoraOcorrencia: "desc",
      },
      take: limit ? parseInt(limit) : undefined,
    });

    // Serialize BigInt to string
    const serialized = ocorrencias.map((oc) => ({
      id: oc.id.toString(),
      uuid: oc.uuid,
      dataHoraOcorrencia: oc.dataHoraOcorrencia.toISOString(),
      lado: oc.lado,
      pistaFaixa: oc.pistaFaixa,
      anotacoes: oc.anotacoes,
      status: oc.status,
      valorMedido: oc.valor_medido ? Number(oc.valor_medido) : null,
      unidadeMedida: oc.unidade_medida,
      dentroDoLimite: oc.dentro_do_limite,
      registroReferenteA: oc.registroReferenteA,
      createdAt: oc.createdAt.toISOString(),
      updatedAt: oc.updatedAt.toISOString(),
      indicador: oc.indicadores ? {
        id: oc.indicadores.id.toString(),
        nome: oc.indicadores.nome,
        sigla: oc.indicadores.sigla,
        unidadeMedida: oc.indicadores.unidadeMedida,
      } : null,
      inspecao: {
        id: oc.inspecoes.id.toString(),
        uuid: oc.inspecoes.uuid,
        periodoReferencia: oc.inspecoes.periodoReferencia.toISOString(),
        status: oc.inspecoes.status,
        rodovia: {
          id: oc.inspecoes.rodovias.id.toString(),
          nome: oc.inspecoes.rodovias.nome,
          codigo: oc.inspecoes.rodovias.codigo,
        },
      },
      fotos: oc.ocorrencias_fotos.map((foto) => ({
        id: foto.id.toString(),
        uuid: foto.uuid,
        caminhoArquivo: foto.caminhoArquivo,
        latitude: foto.latitude ? Number(foto.latitude) : null,
        longitude: foto.longitude ? Number(foto.longitude) : null,
        dataHoraFoto: foto.dataHoraFoto.toISOString(),
        ordem: foto.ordem,
      })),
      trechos: oc.ocorrencias_trechos.map((trecho) => ({
        id: trecho.id.toString(),
        uuid: trecho.uuid,
        kmInicial: Number(trecho.kmInicial),
        kmFinal: trecho.kmFinal ? Number(trecho.kmFinal) : null,
        ordem: trecho.ordem,
        segmentoHomogeneo: {
          id: trecho.segmentos_homogeneos.id.toString(),
          nome: trecho.segmentos_homogeneos.nome,
          kmInicial: Number(trecho.segmentos_homogeneos.kmInicial),
          kmFinal: Number(trecho.segmentos_homogeneos.kmFinal),
        },
      })),
    }));

    return NextResponse.json({ 
      ocorrencias: serialized,
      total: serialized.length 
    });
  } catch (error: any) {
    console.error("Error fetching ocorrencias:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ocorrências" },
      { status: 500 }
    );
  }
}
