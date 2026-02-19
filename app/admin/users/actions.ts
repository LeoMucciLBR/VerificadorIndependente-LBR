"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    // Validate required fields
    if (!email || !password) {
      return { success: false, error: "Email e senha são obrigatórios" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: "Usuário com este email já existe" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        uuid: randomUUID(),
        name: name || null,
        email,
        passwordHash: hashedPassword,
        role: role as any || "USER"
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Erro ao criar usuário" };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const password = formData.get("password") as string;

    const updateData: any = {
      name: name || null,
      email,
      role: role as any || "USER"
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.passwordHash = await bcrypt.hash(password, 10); // Fixed: use passwordHash not password
    }

    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: updateData
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Erro ao atualizar usuário" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: BigInt(userId) }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Erro ao excluir usuário" };
  }
}

export async function toggleUserStatus(userId: string) {
  try {
    // Get current user status
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { isActive: true }
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Toggle the isActive status
    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { 
        isActive: !user.isActive 
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { success: false, error: "Erro ao alterar status do usuário" };
  }
}

export async function assignUserToProject(
  userId: bigint, 
  projectId: bigint, 
  role: 'ADMIN' | 'FISCAL' | 'CONSULTA'
) {
  // TODO: Implementar quando o modelo UserProjectAssignment for criado no Prisma
  console.warn("assignUserToProject: Funcionalidade ainda não implementada", { userId, projectId, role });
  return { success: false, error: "Funcionalidade em desenvolvimento" };
}

export async function removeUserFromProject(userId: bigint, projectId: bigint) {
  // TODO: Implementar quando o modelo UserProjectAssignment for criado no Prisma
  console.warn("removeUserFromProject: Funcionalidade ainda não implementada", { userId, projectId });
  return { success: false, error: "Funcionalidade em desenvolvimento" };
}


