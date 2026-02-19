"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function getDashboardCards() {
  try {
    const cards = await prisma.dashboardCard.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        fases: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });
    
    // Serialize BigInt to string for frontend compatibility
    const serialized = cards.map(card => ({
      ...card,
      id: card.id.toString(),
      fase_id: card.fase_id?.toString() || null,
      fase: card.fases ? { id: card.fases.id.toString(), nome: card.fases.nome } : null,
      fases: undefined // Remove raw relation
    }));
    
    return { success: true, data: serialized };
  } catch (error) {
    console.error("Erro ao buscar dashboard cards:", error);
    return { success: false, error: "Falha ao carregar cards do dashboard." };
  }
}

export async function createDashboardCard(formData: FormData) {
  try {
    const period = formData.get("period") as string;
    const dateLabel = formData.get("date") as string;
    const score = parseFloat(formData.get("score") as string);
    const faseId = formData.get("faseId") as string;
    const sortOrder = parseInt(formData.get("order") as string) || 0;

    const card = await prisma.dashboardCard.create({
      data: {
        uuid: randomUUID(),
        period,
        dateLabel,
        score,
        fase_id: faseId ? BigInt(faseId) : null,
        sortOrder
      }
    });

    revalidatePath("/home");
    revalidatePath("/admin/settings");
    
    return { success: true, data: card };
  } catch (error) {
    console.error("Erro ao criar dashboard card:", error);
    return { success: false, error: "Erro ao criar card." };
  }
}

export async function updateDashboardCard(id: string, formData: FormData) {
  try {
    const period = formData.get("period") as string;
    const dateLabel = formData.get("date") as string;
    const score = parseFloat(formData.get("score") as string);
    const faseId = formData.get("faseId") as string;
    const sortOrder = parseInt(formData.get("order") as string) || 0;

    const card = await prisma.dashboardCard.update({
      where: { id: BigInt(id) },
      data: {
        period,
        dateLabel,
        score,
        fase_id: faseId ? BigInt(faseId) : null,
        sortOrder
      }
    });

    revalidatePath("/home");
    revalidatePath("/admin/settings");
    
    return { success: true, data: card };
  } catch (error) {
    console.error("Erro ao atualizar dashboard card:", error);
    return { success: false, error: "Falha ao atualizar card." };
  }
}

export async function deleteDashboardCard(id: string) {
  try {
    await prisma.dashboardCard.delete({
      where: { id: BigInt(id) }
    });
    
    revalidatePath("/home");
    revalidatePath("/admin/settings");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir dashboard card:", error);
    return { success: false, error: "Falha ao excluir card." };
  }
}
