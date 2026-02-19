import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as turf from "@turf/turf";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { routeName, geojson, projectName, description } = body;

    if (!routeName || !geojson) {
      return NextResponse.json(
        { error: "routeName and geojson are required" },
        { status: 400 }
      );
    }

    // Calculate route length if possible
    let lengthKm = null;
    try {
      if (geojson.type === "FeatureCollection" && geojson.features) {
        let totalLength = 0;
        
        for (const feature of geojson.features) {
          if (feature.geometry) {
            const turfFeature = turf.feature(feature.geometry);
            const length = turf.length(turfFeature, { units: "kilometers" });
            totalLength += length;
          }
        }
        
        lengthKm = totalLength;
      }
    } catch (error) {
      console.error("Error calculating length:", error);
    }

    // Save to database
    const route = await prisma.highwayRoute.create({
      data: {
        uuid: randomUUID(),
        routeName,
        projectName: projectName || null,
        description: description || null,
        geojson: geojson as any,
        lengthKm: lengthKm ? parseFloat(lengthKm.toFixed(2)) : null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      route: {
        id: route.id,
        routeName: route.routeName,
        lengthKm: route.lengthKm,
      }
    });
  } catch (error: any) {
    console.error("Error saving route:", error);
    return NextResponse.json(
      { error: "Failed to save route", details: error.message },
      { status: 500 }
    );
  }
}
