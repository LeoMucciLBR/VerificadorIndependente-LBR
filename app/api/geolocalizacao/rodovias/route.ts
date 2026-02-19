import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const rodovias = await prisma.rodovia.findMany({
      select: {
        id: true,
        uuid: true,
        nome: true,
        codigo: true,
        concessionaria: true,
      },
      orderBy: { nome: "asc" },
    });

    // Serialize BigInt to string
    const serializedRodovias = rodovias.map((rodovia) => ({
      ...rodovia,
      id: rodovia.id.toString(),
    }));

    return NextResponse.json(
      { rodovias: serializedRodovias },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching rodovias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar rodovias" },
      { status: 500 }
    );
  }
}
