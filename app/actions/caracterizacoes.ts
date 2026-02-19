"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TipoRetorno } from "@/types/enums";
import { randomUUID } from "crypto";

export async function getCaracterizacoes() {
  try {
    const caracterizacoes = await prisma.caracterizacao.findMany({
      orderBy: {
        descricao: 'asc',
      },
      include: {
        indicadores: {
          select: {
            nome: true,
            sigla: true
          }
        },
        caracterizacoes_fases: {
          include: {
            fases: {
              select: {
                nome: true
              }
            }
          }
        }
      }
    });

    // Serialize BigInt and map to frontend-friendly format
    const serialized = caracterizacoes.map(c => ({
      id: c.id.toString(),
      indicadorId: c.indicador_id.toString(),
      descricao: c.descricao,
      regulamentacao: c.regulamentacao || '',
      tipoRetorno: c.tipoRetorno,
      indicador: c.indicadores,
      fases: c.caracterizacoes_fases.map(cf => ({
        faseId: cf.fase_id.toString(),
        fase: cf.fases
      }))
    }));
    
    return { success: true, data: serialized };
  } catch (error) {
    console.error("Erro ao buscar caracterizações:", error);
    return { success: false, error: "Falha ao carregar caracterizações." };
  }
}

export async function createCaracterizacao(formData: FormData) {
  try {
    const indicadorId = formData.get("indicadorId") as string;
    const descricao = formData.get("descricao") as string;
    const regulamentacao = formData.get("regulamentacao") as string;
    const tipoRetorno = formData.get("tipoRetorno") as TipoRetorno;
    const fasesIds = formData.getAll("faseIds") as string[];

    console.log("Creating Caracterizacao with fases:", fasesIds);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar a caracterização
      const caracterizacao = await tx.caracterizacao.create({
        data: {
          uuid: randomUUID(),
          indicador_id: BigInt(indicadorId),
          descricao,
          regulamentacao,
          tipoRetorno,
        },
      });

      // 2. Criar os relacionamentos com fases
      if (fasesIds.length > 0) {
        await tx.caracterizacaoFase.createMany({
          data: fasesIds.map(faseId => ({
            caracterizacao_id: caracterizacao.id,
            fase_id: BigInt(faseId)
          }))
        });
      }

      return caracterizacao;
    });

    revalidatePath("/admin/settings");
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao criar caracterização:", error);
    return { success: false, error: "Falha ao criar caracterização." };
  }
}

export async function updateCaracterizacao(id: string, formData: FormData) {
  try {
    const indicadorId = formData.get("indicadorId") as string;
    const descricao = formData.get("descricao") as string;
    const regulamentacao = formData.get("regulamentacao") as string;
    const tipoRetorno = formData.get("tipoRetorno") as TipoRetorno;
    const fasesIds = formData.getAll("faseIds") as string[];

    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar dados básicos
      const caracterizacao = await tx.caracterizacao.update({
        where: { id: BigInt(id) },
        data: {
          indicador_id: BigInt(indicadorId),
          descricao,
          regulamentacao,
          tipoRetorno,
        },
      });

      // 2. Atualizar relacionamentos (Estratégia: Delete All + Create Many)
      //    Simples e eficaz para N:N sem dados extras na tabela de junção
      await tx.caracterizacaoFase.deleteMany({
        where: { caracterizacao_id: BigInt(id) }
      });

      if (fasesIds.length > 0) {
         await tx.caracterizacaoFase.createMany({
          data: fasesIds.map(faseId => ({
            caracterizacao_id: BigInt(id),
            fase_id: BigInt(faseId)
          }))
        });
      }

      return caracterizacao;
    });

    revalidatePath("/admin/settings");
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao atualizar caracterização:", error);
    return { success: false, error: "Falha ao atualizar caracterização." };
  }
}

export async function deleteCaracterizacao(id: string) {
  try {
    // Delete simples, o relacionamento CaracterizacaoFase deve ser deletado via Cascade definido no Schema,
    // mas se não estiver, precisariamos deletar manual. O Schema tem onDelete: Cascade?
    // Verificando schema mentalmente: models N:N geralmente precisam de cascade explicito.
    // Vamos garantir deletando a relação antes se necessário, mas o prisma cuida se estiver configurado.
    
    await prisma.caracterizacao.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir caracterização:", error);
    return { success: false, error: "Falha ao excluir caracterização." };
  }
}
