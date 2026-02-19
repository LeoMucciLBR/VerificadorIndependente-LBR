import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read GeoJSON file
    const text = await file.text();
    const geojson = JSON.parse(text);

    // Validate GeoJSON structure
    if (!geojson.type || geojson.type !== "FeatureCollection") {
      return NextResponse.json(
        { error: "Invalid GeoJSON: must be a FeatureCollection" },
        { status: 400 }
      );
    }

    const routeName = file.name.replace(/\.geojson$/i, "");
    
    
    // Check size
    const geojsonSize = JSON.stringify(geojson).length;

    if (geojsonSize > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande (>200MB). Por favor, otimize-o primeiro." },
        { status: 413 }
      );
    }

    // Save to Database
    const route = await prisma.highwayRoute.create({
      data: {
        uuid: randomUUID(),
        routeName,
        description: `Imported GeoJSON from ${file.name}`,
        geojson: geojson as any,
      },
    });

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error("Error processing GeoJSON:", error);
    return NextResponse.json(
      { error: "Error processing file: " + (error as Error).message },
      { status: 500 }
    );
  }
}
