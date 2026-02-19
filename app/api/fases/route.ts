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
    const isActive = searchParams.get("active");

    const where: any = {};

    if (projectId) {
      where.project_id = BigInt(projectId);
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const fases = await prisma.fase.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        nome: true,
        dataInicio: true,
        dataFim: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            nome: true,
            codigo: true,
          }
        },
        _count: {
          select: {
            inspecoes: true,
            medicoes: true,
          },
        },
      },
      orderBy: [
        { dataInicio: "desc" }
      ],
    });

    // Serialize BigInt to string
    const serialized = fases.map((fase) => ({
      id: fase.id.toString(),
      uuid: fase.uuid,
      nome: fase.nome,
      dataInicio: fase.dataInicio.toISOString(),
      dataFim: fase.dataFim.toISOString(),
      isActive: fase.isActive,
      createdAt: fase.createdAt.toISOString(),
      updatedAt: fase.updatedAt.toISOString(),
      criadoPor: {
        id: fase.users.id.toString(),
        name: fase.users.name || "Usuário sem nome",
        email: fase.users.email,
      },
      project: fase.projects ? {
        id: fase.projects.id.toString(),
        nome: fase.projects.nome,
        codigo: fase.projects.codigo,
      } : null,
      stats: {
        totalInspecoes: fase._count.inspecoes,
        totalMedicoes: fase._count.medicoes,
      },
    }));

    return NextResponse.json({ fases: serialized });
  } catch (error: any) {
    console.error("Error fetching fases:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar fases" },
      { status: 500 }
    );
  }
}
