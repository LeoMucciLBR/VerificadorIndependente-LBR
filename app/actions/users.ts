"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { RoleValue } from "@/types/enums";

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: {
        instituicao: {
          select: { nome: true }
        }
      }
    });

    // Remover senhas do retorno e serializar BigInt
    const safeUsers = users.map(user => {
      const { passwordHash, mfaSecretEnc, ...rest } = user;
      return {
        ...rest,
        id: rest.id.toString(),
        instituicaoId: rest.instituicaoId?.toString() || null,
      };
    });

    return { success: true, data: safeUsers };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return { success: false, error: "Falha ao carregar usuários." };
  }
}

export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as RoleValue;
    const instituicaoId = formData.get("instituicaoId") as string | null;
    const podeCadastrar = formData.get("podeCadastrar") === "true";

    // Hash password with secure settings
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        uuid: randomUUID(),
        name,
        email,
        passwordHash: hashedPassword,
        role,
        instituicaoId: instituicaoId ? BigInt(instituicaoId) : null,
        podeCadastrar,
      },
    });

    revalidatePath("/admin/users");
    
    return { success: true, data: { ...user, id: user.id.toString() } };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return { success: false, error: "Erro ao criar usuário (verifique se o email já existe)." };
  }
}

export async function updateUser(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as RoleValue;
    const instituicaoId = formData.get("instituicaoId") as string | null;
    const podeCadastrar = formData.get("podeCadastrar") === "true";
    const password = formData.get("password") as string | null;

    const updateData: any = {
      name,
      email,
      role,
      instituicaoId: instituicaoId ? BigInt(instituicaoId) : null,
      podeCadastrar,
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    revalidatePath("/admin/users");
    return { success: true, data: { ...user, id: user.id.toString() } };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return { success: false, error: "Falha ao atualizar usuário." };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id: BigInt(id) },
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return { success: false, error: "Falha ao excluir usuário." };
  }
}
