"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function getInstitutions() {
  try {
    const institutions = await prisma.instituicao.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    // Serialize BigInt to string for frontend compatibility
    const serialized = institutions.map(inst => ({
      ...inst,
      id: inst.id.toString(),
    }));
    
    return { success: true, data: serialized };
  } catch (error) {
    console.error("Erro ao buscar instituições:", error);
    return { success: false, error: "Falha ao carregar instituições." };
  }
}

export async function createInstitution(formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const nomeResponsavel = formData.get("nomeResponsavel") as string;
    const emailResponsavel = formData.get("emailResponsavel") as string;

    const institution = await prisma.instituicao.create({
      data: {
        uuid: randomUUID(),
        nome,
        nomeResponsavel,
        emailResponsavel,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: institution };
  } catch (error) {
    console.error("Erro ao criar instituição:", error);
    return { success: false, error: "Falha ao criar instituição." };
  }
}

export async function updateInstitution(id: string, formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const nomeResponsavel = formData.get("nomeResponsavel") as string;
    const emailResponsavel = formData.get("emailResponsavel") as string;

    const institution = await prisma.instituicao.update({
      where: { id: BigInt(id) },
      data: {
        nome,
        nomeResponsavel,
        emailResponsavel,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: institution };
  } catch (error) {
    console.error("Erro ao atualizar instituição:", error);
    return { success: false, error: "Falha ao atualizar instituição." };
  }
}

export async function deleteInstitution(id: string) {
  try {
    // Check for users
    const institution = await prisma.instituicao.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (institution && institution._count.users > 0) {
      return { success: false, error: "Não é possível excluir uma instituição que possui usuários vinculados." };
    }

    await prisma.instituicao.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir instituição:", error);
    return { success: false, error: "Falha ao excluir instituição." };
  }
}
