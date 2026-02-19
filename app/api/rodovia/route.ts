import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const routes = await prisma.highwayRoute.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Error fetching routes" },
      { status: 500 }
    );
  }
}
