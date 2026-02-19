import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rodoviaId = searchParams.get("rodoviaId");

    // Buscar segmentos da rodovia com geometria
    const where = rodoviaId ? { rodovia_id: BigInt(rodoviaId) } : {};
    
    const segmentos = await prisma.segmento.findMany({
      where,
      include: {
        rodovias: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        kmInicial: 'asc',
      },
    });

    return NextResponse.json(segmentos);
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json(
      { error: "Error fetching segments" },
      { status: 500 }
    );
  }
}
