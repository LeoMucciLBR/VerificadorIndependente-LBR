'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export async function createProject(formData: FormData) {
  const nome = formData.get("nome") as string;
  const codigo = formData.get("codigo") as string;
  const slug = formData.get("slug") as string;
  const descricao = formData.get("descricao") as string;
  const ativo = formData.get("ativo") === "on";

  if (!nome || !codigo || !slug) {
    throw new Error("Campos obrigatórios faltando");
  }

  try {
    await prisma.projects.create({
      data: {
        uuid: randomUUID(),
        nome,
        codigo,
        slug,
        descricao,
        ativo
      }
    });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    throw new Error("Erro ao criar projeto. Verifique se o código ou slug já existem.");
  }

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProject(id: bigint, formData: FormData) {
  const nome = formData.get("nome") as string;
  const codigo = formData.get("codigo") as string;
  const slug = formData.get("slug") as string;
  const descricao = formData.get("descricao") as string;
  const ativo = formData.get("ativo") === "on";

  if (!nome || !codigo || !slug) {
    throw new Error("Campos obrigatórios faltando");
  }

  try {
    await prisma.projects.update({
      where: { id },
      data: {
        nome,
        codigo,
        slug,
        descricao,
        ativo
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    throw new Error("Erro ao atualizar projeto.");
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  redirect("/admin/projects");
}
