import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
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

    const buffer = await file.arrayBuffer();
    let kmlString = "";
    let routeName = file.name.replace(/\.(kmz|kml)$/i, "");

    // Check if KMZ (zip) or KML (xml)
    if (file.name.toLowerCase().endsWith(".kmz")) {
      const zip = await JSZip.loadAsync(buffer);
      
      // Find the .kml file inside the zip
      const kmlFile = Object.values(zip.files).find((f) => 
        f.name.toLowerCase().endsWith(".kml")
      );

      if (!kmlFile) {
        return NextResponse.json(
          { error: "Invalid KMZ: No KML file found inside" },
          { status: 400 }
        );
      }

      kmlString = await kmlFile.async("text");
    } else {
      // Direct KML file
      const decoder = new TextDecoder("utf-8");
      kmlString = decoder.decode(buffer);
    }

    // Parse KML to GeoJSON
    const parser = new DOMParser();
    const kmlDom = parser.parseFromString(kmlString, "text/xml");
    const rawGeojson = kml(kmlDom);


    // Optimize GeoJSON: Filter and simplify to reduce size
    const optimizedFeatures = rawGeojson.features
      .filter((feature: any) => {
        // Skip features with invalid geometry
        if (!feature || !feature.geometry || !feature.geometry.type) {
          return false;
        }
        
        // Keep only LineStrings (routes) and Points (markers)
        // Skip Polygons if they're too complex
        const type = feature.geometry.type;
        return type === "LineString" || type === "Point" || type === "MultiLineString";
      })
      .map((feature: any) => {
        // Reduce coordinate precision to 6 decimal places (~0.1m accuracy)
        // This significantly reduces JSON size
        if (feature.geometry.type === "LineString") {
          let coords = feature.geometry.coordinates;
          
          // For very long LineStrings, decimate coordinates (keep every Nth point)
          // This preserves the general shape while drastically reducing size
          if (coords.length > 1000) {
            const decimationFactor = Math.ceil(coords.length / 1000); // Keep ~1000 points max
            coords = coords.filter((_: any, index: number) => index % decimationFactor === 0);
            // Always keep the last point
            if (coords[coords.length - 1] !== feature.geometry.coordinates[feature.geometry.coordinates.length - 1]) {
              coords.push(feature.geometry.coordinates[feature.geometry.coordinates.length - 1]);
            }
          }
          
          feature.geometry.coordinates = coords.map((coord: number[]) => [
            parseFloat(coord[0].toFixed(6)),
            parseFloat(coord[1].toFixed(6)),
          ]);
        } else if (feature.geometry.type === "MultiLineString") {
          feature.geometry.coordinates = feature.geometry.coordinates.map((line: number[][]) => {
            let coords = line;
            
            // Decimate each line segment if too long
            if (coords.length > 1000) {
              const decimationFactor = Math.ceil(coords.length / 1000);
              coords = coords.filter((_: any, index: number) => index % decimationFactor === 0);
              if (coords[coords.length - 1] !== line[line.length - 1]) {
                coords.push(line[line.length - 1]);
              }
            }
            
            return coords.map((coord: number[]) => [
              parseFloat(coord[0].toFixed(6)),
              parseFloat(coord[1].toFixed(6)),
            ]);
          });
        } else if (feature.geometry.type === "Point") {
          feature.geometry.coordinates = [
            parseFloat(feature.geometry.coordinates[0].toFixed(6)),
            parseFloat(feature.geometry.coordinates[1].toFixed(6)),
          ];
        }

        // Keep only essential properties
        return {
          type: feature.type,
          geometry: feature.geometry,
          properties: {
            name: feature.properties?.name || "",
            description: feature.properties?.description || "",
          },
        };
      });

    const geojson = {
      type: "FeatureCollection",
      features: optimizedFeatures,
    };

    
    // Check size before saving
    const geojsonSize = JSON.stringify(geojson).length;

    if (geojsonSize > 200 * 1024 * 1024) { // 200MB limit
      return NextResponse.json(
        { error: "O arquivo é muito grande mesmo após otimização. Considere dividir em múltiplos arquivos." },
        { status: 413 }
      );
    }

    // Save to Database
    const route = await prisma.highwayRoute.create({
      data: {
        uuid: randomUUID(),
        routeName,
        description: `Imported from ${file.name}`,
        geojson: geojson as any, // Prisma Json type
      },
    });

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error("Error processing KMZ/KML:", error);
    return NextResponse.json(
      { error: "Error processing file: " + (error as Error).message },
      { status: 500 }
    );
  }
}
