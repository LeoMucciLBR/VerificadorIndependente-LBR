"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

// --- Constantes ---

export async function getConstants() {
  try {
    const constants = await prisma.constante.findMany({
      orderBy: { nome: 'asc' }
    });
    
    // Transform Decimal to Number for serialization safety
    const serialized = constants.map((c: any) => ({
      ...c,
      valor: Number(c.valor)
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Erro ao buscar constantes:", error);
    return { success: false, error: "Falha ao carregar constantes." };
  }
}

export async function createConstant(formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const valor = Number(formData.get("valor"));

    // O Prisma aceita number JS para Decimal na escrita normal
    const constant = await prisma.constante.create({
      data: {
        uuid: randomUUID(),
        nome,
        valor,
      },
    });

    revalidatePath("/admin/settings");
    // Converter no retorno
    return { success: true, data: { ...constant, valor: Number(constant.valor) } };
  } catch (error) {
    console.error("Erro ao criar constante:", error);
    return { success: false, error: "Falha ao criar constante." };
  }
}

export async function updateConstant(id: string, formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const valor = Number(formData.get("valor"));

    const constant = await prisma.constante.update({
      where: { id: BigInt(id) },
      data: {
        nome,
        valor,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: { ...constant, valor: Number(constant.valor) } };
  } catch (error) {
    console.error("Erro ao atualizar constante:", error);
    return { success: false, error: "Falha ao atualizar constante." };
  }
}

export async function deleteConstant(id: string) {
  try {
    await prisma.constante.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir constante:", error);
    return { success: false, error: "Falha ao excluir constante." };
  }
}

// --- Variáveis ---

export async function getVariables() {
  try {
    const variables = await prisma.variavel.findMany({
      orderBy: { nome: 'asc' }
    });
    
    // Transform Decimal to Number
    const serialized = variables.map((v: any) => ({
      ...v,
      valorPadrao: Number(v.valorPadrao)
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Erro ao buscar variáveis:", error);
    return { success: false, error: "Falha ao carregar variáveis." };
  }
}

export async function createVariable(formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const valorPadrao = Number(formData.get("valorPadrao"));

    const variable = await prisma.variavel.create({
      data: {
        uuid: randomUUID(),
        nome,
        valorPadrao,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: { ...variable, valorPadrao: Number(variable.valorPadrao) } };
  } catch (error) {
    console.error("Erro ao criar variável:", error);
    return { success: false, error: "Falha ao criar variável." };
  }
}

export async function updateVariable(id: string, formData: FormData) {
  try {
    const nome = formData.get("nome") as string;
    const valorPadrao = Number(formData.get("valorPadrao"));

    const variable = await prisma.variavel.update({
      where: { id: BigInt(id) },
      data: {
        nome,
        valorPadrao,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: { ...variable, valorPadrao: Number(variable.valorPadrao) } };
  } catch (error) {
    console.error("Erro ao atualizar variável:", error);
    return { success: false, error: "Falha ao atualizar variável." };
  }
}

export async function deleteVariable(id: string) {
  try {
    await prisma.variavel.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir variável:", error);
    return { success: false, error: "Falha ao excluir variável." };
  }
}
