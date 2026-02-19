
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rodoviaId = searchParams.get("rodoviaId");

    if (!rodoviaId) {
      return NextResponse.json({ error: "Rodovia não especificada" }, { status: 400 });
    }

    const rodovia = await prisma.rodovia.findUnique({
        where: { uuid: rodoviaId }
    });

    if (!rodovia) {
         return NextResponse.json({ error: "Rodovia não encontrada" }, { status: 404 });
    }

    // Deletar marcos
    const deleted = await prisma.marcoQuilometrico.deleteMany({
        where: { rodovia_id: rodovia.id }
    });

    return NextResponse.json({ 
        message: "Marcos excluídos com sucesso", 
        count: deleted.count 
    });

  } catch (error: any) {
    console.error("Erro excluindo marcos:", error);
    return NextResponse.json({ error: error.message || "Falha na exclusão" }, { status: 500 });
  }
}
