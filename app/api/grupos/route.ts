import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const includeSubgrupos = searchParams.get("includeSubgrupos") === "true";

    const where: any = {};

    if (projectId) {
      where.project_id = BigInt(projectId);
    }

    const grupos = await prisma.grupo.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        nome: true,
        sigla: true,
        peso: true,
        grupoPai_id: true,
        createdAt: true,
        updatedAt: true,
        ...(includeSubgrupos && {
          grupos: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            }
          },
          other_grupos: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            }
          },
        }),
      },
      orderBy: [
        { grupoPai_id: "asc" },
        { nome: "asc" }
      ],
    });

    // Serialize BigInt to string
    const serialized = grupos.map((grupo) => ({
      id: grupo.id.toString(),
      uuid: grupo.uuid,
      nome: grupo.nome,
      sigla: grupo.sigla,
      peso: Number(grupo.peso),
      grupoPaiId: grupo.grupoPai_id ? grupo.grupoPai_id.toString() : null,
      createdAt: grupo.createdAt.toISOString(),
      updatedAt: grupo.updatedAt.toISOString(),
      ...(includeSubgrupos && {
        grupoPai: (grupo as any).grupos ? {
          id: (grupo as any).grupos.id.toString(),
          nome: (grupo as any).grupos.nome,
          sigla: (grupo as any).grupos.sigla,
        } : null,
        subgrupos: (grupo as any).other_grupos?.map((sub: any) => ({
          id: sub.id.toString(),
          nome: sub.nome,
          sigla: sub.sigla,
        })) || [],
      }),
    }));

    return NextResponse.json({ grupos: serialized });
  } catch (error: any) {
    console.error("Error fetching grupos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar grupos" },
      { status: 500 }
    );
  }
}
