"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPhases() {
  try {
    const phases = await prisma.fase.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        users: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    // Transform relation 'users' -> 'criadoPor' and serialize BigInt
    const mappedPhases = phases.map(p => ({
      ...p,
      id: p.id.toString(), // Serialize BigInt to string
      criadoPor_user_id: p.criadoPor_user_id.toString(),
      project_id: p.project_id?.toString() || null,
      criadoPor: p.users,
      users: undefined
    }));

    return { success: true, data: mappedPhases };
  } catch (error) {
    console.error("Erro ao buscar fases:", error);
    return { success: false, error: "Falha ao carregar fases." };
  }
}

export async function createPhase(formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const dataInicio = new Date(formData.get("dataInicio") as string);
    const dataFim = new Date(formData.get("dataFim") as string);
    
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("Usuário não encontrado para auditoria.");

    const phase = await prisma.fase.create({
      data: {
        nome,
        dataInicio,
        dataFim,
        uuid: crypto.randomUUID(),
        criadoPor_user_id: user.id,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: phase };
  } catch (error) {
    console.error("Erro ao criar fase:", error);
    return { success: false, error: "Falha ao criar fase." };
  }
}

export async function updatePhase(id: string, formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const dataInicio = new Date(formData.get("dataInicio") as string);
    const dataFim = new Date(formData.get("dataFim") as string);

    const phase = await prisma.fase.update({
      where: { id: BigInt(id) },
      data: {
        nome,
        dataInicio,
        dataFim,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: phase };
  } catch (error) {
    console.error("Erro ao atualizar fase:", error);
    return { success: false, error: "Falha ao atualizar fase." };
  }
}

export async function deletePhase(id: string) {
  try {
    // Soft delete
    await prisma.fase.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir fase:", error);
    return { success: false, error: "Falha ao excluir fase." };
  }
}
