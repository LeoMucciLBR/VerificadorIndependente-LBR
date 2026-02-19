"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updateProjectSettings(prevState: any, formData: FormData) {
  const session = await getSession();
  
  if (!session || !session.user) {
    return { error: "Usuário não autenticado" };
  }

  const rawData: any = {
    title: formData.get("title") as string,
    clientName: formData.get("clientName") as string,
    contractNumber: formData.get("contractNumber") as string,
    segmentName: formData.get("segmentName") as string,
    extension: formData.get("extension") as string,
    startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : null,
    endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
  };

  // Upload da imagem hero via S3 ou storage local
  const file = formData.get("heroImageFile") as File;
  if (file && file.size > 0) {
    try {
      const { uploadFile, getFileUrl } = await import("@/lib/s3");
      
      const filename = `hero-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const key = `projetos/${filename}`;
      
      const result = await uploadFile(file, key, file.type);
      
      if (!result.success) {
        console.error("Erro no upload:", result.error);
        return { error: "Falha ao fazer upload da imagem" };
      }
      
      const url = await getFileUrl(key);
      rawData.heroImageUrl = url;
    } catch (err) {
      console.error("Erro no upload:", err);
      return { error: "Falha ao fazer upload da imagem" };
    }
  }

  try {
    const existing = await prisma.projectInfo.findFirst();
    const actorId = BigInt(session.userId);

    if (existing) {
      await prisma.projectInfo.update({
        where: { id: existing.id },
        data: {
          ...rawData,
          updatedBy_user_id: actorId, 
        },
      });

      await logAudit({
        action: "UPDATE",
        resource: "ProjectInfo",
        resourceId: existing.id.toString(),
        details: { changes: rawData },
        actorId: session.userId,
        actorEmail: session.user.email,
        actorRole: session.user.role as any,
        severity: "WARNING",
      });
    } else {
      const newRecord = await prisma.projectInfo.create({
        data: {
          ...rawData,
          updatedBy_user_id: actorId,
        },
      });
      
      await logAudit({
        action: "CREATE",
        resource: "ProjectInfo",
        resourceId: newRecord.id.toString(),
        details: { initial: rawData },
        actorId: session.userId,
        actorEmail: session.user.email,
        actorRole: session.user.role as any,
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/home");
    revalidatePath("/sintese");
    
    return { success: true };

  } catch (error) {
    console.error("Falha ao atualizar configurações:", error);
    return { error: "Erro ao atualizar configurações" };
  }
}

export async function getProjectSettings() {
  return await prisma.projectInfo.findFirst();
}
