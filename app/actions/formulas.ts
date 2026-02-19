"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function getFormulas() {
  try {
// @ts-ignore
    const formulas = await prisma.formula.findMany({
      orderBy: { nome: 'asc' },
      include: {
        grupos: {
          select: { nome: true }
        },
        formulas_fases: {
          include: {
            fases: { select: { nome: true } }
          }
        },
        users: {
          select: { name: true }
        }
      }
    });

    return { success: true, data: formulas };
  } catch (error) {
    console.error("Erro ao buscar fórmulas:", error);
    return { success: false, error: "Falha ao carregar fórmulas." };
  }
}

export async function createFormula(formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const expressao = formData.get("expressao") as string;
    const grupoId = formData.get("grupoId") as string;
    const isPrincipal = formData.get("isPrincipal") === "true";
    const exigeGeolocalizacao = formData.get("exigeGeolocalizacao") === "true";
    const exigePeriodo = formData.get("exigePeriodo") === "true";
    const faseIds = formData.getAll("faseIds") as string[];
    
    // TODO: Obter ID do usuário real da sessão via auth()
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) return { success: false, error: "Nenhum usuário encontrado para atribuir a criação." };

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Formula
      // @ts-ignore
      const formula = await tx.formula.create({
        data: {
          uuid: randomUUID(),
          nome,
          descricao,
          expressao,
          grupo_id: BigInt(grupoId),
          isPrincipal,
          exigeGeolocalizacao,
          exigePeriodo,
          criadoPor_user_id: firstUser.id, 
        },
      });

      // 2. Link Phases
      if (faseIds.length > 0) {
        // @ts-ignore
        await tx.formulaFase.createMany({
          data: faseIds.map(faseId => ({
            formula_id: formula.id,
            fase_id: BigInt(faseId)
          }))
        });
      }

      return formula;
    });

    revalidatePath("/admin/settings");
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao criar fórmula:", error);
    return { success: false, error: "Falha ao criar fórmula." };
  }
}

export async function updateFormula(id: string, formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const descricao = formData.get("descricao") as string;
    const expressao = formData.get("expressao") as string;
    const grupoId = formData.get("grupoId") as string;
    const isPrincipal = formData.get("isPrincipal") === "true";
    const exigeGeolocalizacao = formData.get("exigeGeolocalizacao") === "true";
    const exigePeriodo = formData.get("exigePeriodo") === "true";
    const faseIds = formData.getAll("faseIds") as string[];

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Formula Data
      // @ts-ignore
      const formula = await tx.formula.update({
        where: { id: BigInt(id) },
        data: {
          nome,
          descricao,
          expressao,
          grupo_id: BigInt(grupoId),
          isPrincipal,
          exigeGeolocalizacao,
          exigePeriodo,
        },
      });

      // 2. Sync Phases (Delete All + Create Many)
      // @ts-ignore
      await tx.formulaFase.deleteMany({
        where: { formula_id: BigInt(id) }
      });

      if (faseIds.length > 0) {
        // @ts-ignore
        await tx.formulaFase.createMany({
          data: faseIds.map(faseId => ({
            formula_id: BigInt(id),
            fase_id: BigInt(faseId)
          }))
        });
      }

      return formula;
    });

    revalidatePath("/admin/settings");
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao atualizar fórmula:", error);
    return { success: false, error: "Falha ao atualizar fórmula." };
  }
}

export async function deleteFormula(id: string) {
  try {
    // @ts-ignore
    await prisma.formula.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir fórmula:", error);
    return { success: false, error: "Falha ao excluir fórmula." };
  }
}
