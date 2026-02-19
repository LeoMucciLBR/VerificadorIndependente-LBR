"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';

export async function getGroups() {
  try {
    // Busca plana para montagem da árvore no cliente
    const groups = await prisma.grupo.findMany({
      orderBy: {
        nome: 'asc',
      },
      include: {
        _count: {
          select: { 
            other_grupos: true,
            indicadores: true
          }
        },
        grupos: {
          select: {
            nome: true
          }
        }
      }
    });
    const serializedGroups = groups.map((group: any) => ({
      ...group,
      id: group.id.toString(),
      grupoPai_id: group.grupoPai_id ? group.grupoPai_id.toString() : null,
      project_id: group.project_id ? group.project_id.toString() : null,
      peso: Number(group.peso)
    }));
    return { success: true, data: serializedGroups };
  } catch (error: any) {
    console.error("Erro ao buscar grupos:", error);
    
    // Check if it's a datetime error
    const errorString = String(error?.message || error || '');
    if (errorString.includes('invalid datetime') || 
        errorString.includes('out of range') ||
        errorString.includes('Value out of range') ||
        errorString.includes('day or month set to zero')) {
      console.warn("⚠️ Há grupos com datas inválidas no banco.");
      return { 
        success: true, 
        data: [], 
        warning: "Existem grupos com datas inválidas no banco de dados. Execute verificação no banco."
      };
    }
    
    return { success: false, error: "Falha ao carregar grupos." };
  }
}

export async function createGroup(formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const sigla = formData.get("sigla") as string;
    const peso = parseFloat(formData.get("peso") as string);
    const grupoPaiId = formData.get("grupoPaiId") as string;

    const group = await prisma.grupo.create({
      data: {
        uuid: uuidv4(),
        nome,
        sigla,
        peso,
        grupoPai_id: grupoPaiId ? BigInt(grupoPaiId) : null,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: { ...group, peso: Number(group.peso) } };
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    return { success: false, error: "Falha ao criar grupo. Verifique se a sigla já existe." };
  }
}

export async function updateGroup(id: string, formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const sigla = formData.get("sigla") as string;
    const peso = parseFloat(formData.get("peso") as string);
    const grupoPaiId = formData.get("grupoPaiId") as string;

    // Validate self-reference
    if (grupoPaiId === id) {
      return { success: false, error: "Um grupo não pode ser pai de si mesmo." };
    }

    const group = await prisma.grupo.update({
      where: { id: BigInt(id) },
      data: {
        nome,
        sigla,
        peso,
        grupoPai_id: grupoPaiId ? BigInt(grupoPaiId) : null,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: { ...group, peso: Number(group.peso) } };
  } catch (error) {
    console.error("Erro ao atualizar grupo:", error);
    return { success: false, error: "Falha ao atualizar grupo." };
  }
}

export async function deleteGroup(id: string) {
  try {
    // Check for subgroups or indicators
    const group = await prisma.grupo.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: { other_grupos: true, indicadores: true }
        }
      }
    });

    if (group && (group._count.other_grupos > 0 || group._count.indicadores > 0)) {
      return { success: false, error: "Não é possível excluir um grupo que possui subgrupos ou indicadores vinculados." };
    }

    await prisma.grupo.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir grupo:", error);
    return { success: false, error: "Falha ao excluir grupo." };
  }
}
