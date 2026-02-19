import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get specific route
      const route = await prisma.highwayRoute.findUnique({
        where: { id: BigInt(id) },
      });

      if (!route) {
        return NextResponse.json(
          { error: "Route not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ route });
    } else {
      // Get all routes
      const routes = await prisma.highwayRoute.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          routeName: true,
          projectName: true,
          description: true,
          geojson: true,
          lengthKm: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ routes });
    }
  } catch (error: any) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    await prisma.highwayRoute.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      { error: "Failed to delete route", details: error.message },
      { status: 500 }
    );
  }
}
