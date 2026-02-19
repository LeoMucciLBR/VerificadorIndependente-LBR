"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AreaAtuacao } from "@/types/enums";
import { v4 as uuidv4 } from 'uuid';

export async function getIndicators() {
  try {
    const indicators = await prisma.indicador.findMany({
      orderBy: {
        nome: 'asc',
      },
      include: {
        grupos: {
          select: {
            nome: true,
            sigla: true
          }
        },
        _count: {
          select: { caracterizacoes: true }
        }
      }
    });
    
    // Serialize Decimal and BigInt fields for Client Components
    const serializedIndicators = indicators.map((indicator: any) => ({
      ...indicator,
      id: indicator.id.toString(),
      grupo_id: indicator.grupo_id.toString(),
      valor_meta: indicator.valor_meta ? Number(indicator.valor_meta) : null
    }));
    
    return { success: true, data: serializedIndicators };
  } catch (error: any) {
    console.error("Erro ao buscar indicadores:", error);
    
    // Check if it's a datetime error
    const errorString = String(error?.message || error || '');
    if (errorString.includes('invalid datetime') || 
        errorString.includes('out of range') ||
        errorString.includes('Value out of range') ||
        errorString.includes('day or month set to zero')) {
      console.warn("⚠️ Há indicadores com datas inválidas no banco.");
      return { 
        success: true, 
        data: [], 
        warning: "Existem indicadores com datas inválidas no banco de dados. Execute verificação no banco."
      };
    }
    
    return { success: false, error: "Falha ao carregar indicadores." };
  }
}

export async function createIndicator(formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const sigla = formData.get("sigla") as string;
    const unidadeMedida = formData.get("unidadeMedida") as string;
    const areaAtuacao = formData.get("areaAtuacao") as AreaAtuacao;
    const grupoId = formData.get("grupoId") as string;

    const indicator = await prisma.indicador.create({
      data: {
        uuid: uuidv4(),
        nome,
        descricao,
        sigla,
        unidadeMedida,
        areaAtuacao: areaAtuacao as any, // Force compatibility with Prisma generated type
        grupo_id: BigInt(grupoId),
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: indicator };
  } catch (error: any) {
    console.error("Erro ao criar indicador:", error);
    if (error.code === 'P2002') {
        return { success: false, error: "Já existe um indicador com esta sigla." };
    }
    return { success: false, error: "Falha ao criar indicador." };
  }
}

export async function updateIndicator(id: string, formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const sigla = formData.get("sigla") as string;
    const unidadeMedida = formData.get("unidadeMedida") as string;
    const areaAtuacao = formData.get("areaAtuacao") as AreaAtuacao;
    const grupoId = formData.get("grupoId") as string;

    const indicator = await prisma.indicador.update({
      where: { id: BigInt(id) },
      data: {
        nome,
        descricao,
        sigla,
        unidadeMedida,
        areaAtuacao: areaAtuacao as any, // Force compatibility with Prisma generated type
        grupo_id: BigInt(grupoId),
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: indicator };
  } catch (error: any) {
    console.error("Erro ao atualizar indicador:", error);
    if (error.code === 'P2002') {
        return { success: false, error: "Já existe um indicador com esta sigla." };
    }
    return { success: false, error: "Falha ao atualizar indicador." };
  }
}

export async function deleteIndicator(id: string) {
  try {
    // Check constraint manually if needed or let DB handle it?
    // DB has restrict/cascade, but Indicator->Caracterizacao usually implies keeping history.
    // For now, let's allow delete if DB allows (or catch FK error)
    
    await prisma.indicador.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir indicador:", error);
    if (error.code === 'P2003') {
        return { success: false, error: "Não é possível excluir indicator com caracterizações vinculadas." };
    }
    return { success: false, error: "Falha ao excluir indicador." };
  }
}
