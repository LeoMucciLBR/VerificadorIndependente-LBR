
import { PrismaClient } from '@prisma/client';
import * as turf from '@turf/turf';

const prisma = new PrismaClient();

/**
 * Builds a LineString from sorted Point features.
 * Extracts KM from point names and sorts by KM value.
 */
function buildLineFromPoints(geojson: any): any {
  const points: { coord: number[]; km: number }[] = [];
  
  const processFeature = (feature: any) => {
    if (feature.geometry?.type === 'Point') {
      const name = feature.properties?.name || '';
      // Extract KM from name (e.g., "KM 112", "112", "KM112.5")
      const kmMatch = name.match(/(?:km\s*)?(\d+(?:[.,]\d+)?)/i);
      const km = kmMatch ? parseFloat(kmMatch[1].replace(',', '.')) : -1;
      
      if (km >= 0) {
        points.push({
          coord: feature.geometry.coordinates,
          km
        });
      }
    }
  };
  
  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(processFeature);
  } else if (geojson.type === 'Feature') {
    processFeature(geojson);
  }
  
  if (points.length < 2) {
    console.log(`Not enough points with KM info: ${points.length}`);
    return null;
  }
  
  // Sort by KM
  points.sort((a, b) => a.km - b.km);
  
  console.log(`Sorted ${points.length} points by KM: ${points[0].km} to ${points[points.length - 1].km}`);
  
  // Create LineString
  const coordinates = points.map(p => p.coord);
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates
    }
  };
}

async function main() {
  const RODOVIA_ID = 8; // MT-246
  
  console.log(`Fetching Rodovia ID ${RODOVIA_ID}...`);
  const rodovia = await prisma.rodovia.findUnique({
    where: { id: RODOVIA_ID },
  });

  if (!rodovia || !rodovia.geojson) {
    console.error("Rodovia not found or missing GeoJSON!");
    return;
  }

  console.log(`Building LineString from Points for ${rodovia.nome}...`);
  const fullGeoJson = rodovia.geojson as any;
  
  // Build LineString from sorted points
  const mainLineFeature = buildLineFromPoints(fullGeoJson);

  if (!mainLineFeature) {
    console.error("Could not build line from points.");
    return;
  }
  
  const totalLength = turf.length(mainLineFeature as any, { units: 'kilometers' });
  console.log(`Generated Line Length: ${totalLength.toFixed(2)}km`);
  
  // Get first and last KM from the sorted points
  const sortedPoints = fullGeoJson.features
    .filter((f: any) => f.geometry?.type === 'Point')
    .map((f: any) => {
      const name = f.properties?.name || '';
      const match = name.match(/(?:km\s*)?(\d+(?:[.,]\d+)?)/i);
      return match ? parseFloat(match[1].replace(',', '.')) : -1;
    })
    .filter((km: number) => km >= 0)
    .sort((a: number, b: number) => a - b);
  
  const firstKm = sortedPoints[0];
  const lastKm = sortedPoints[sortedPoints.length - 1];
  const kmRange = lastKm - firstKm;
  
  console.log(`KM Range in Points: ${firstKm} to ${lastKm} (Span: ${kmRange.toFixed(2)}km)`);

  // Fetch Segments
  const segments = await prisma.segmentoHomogeneo.findMany({
    where: { rodovia_id: RODOVIA_ID },
    orderBy: { kmInicial: 'asc' }
  });

  console.log(`Found ${segments.length} segments to process.`);

  for (const seg of segments) {
    const kmIniKml = seg.kmInicialKML ? Number(seg.kmInicialKML) : null;
    const kmFimKml = seg.kmFinalKML ? Number(seg.kmFinalKML) : null;
    const kmIniInternal = Number(seg.kmInicial);
    const kmFimInternal = Number(seg.kmFinal);
    const segName = seg.nome;

    // Use KML values (absolute KM)
    const sliceStart = kmIniKml !== null ? kmIniKml : kmIniInternal;
    const sliceEnd = kmFimKml !== null ? kmFimKml : kmFimInternal;

    console.log(`\nProcessing [${seg.id}] ${segName}:`);
    console.log(`  KM_KML: ${sliceStart} - ${sliceEnd}`);
    console.log(`  Internal: ${kmIniInternal} - ${kmFimInternal}`);

    try {
      // Calculate positions as ratio of total line length
      // Map sliceStart/sliceEnd from the KM range to the line distance
      const startRatio = (sliceStart - firstKm) / kmRange;
      const endRatio = (sliceEnd - firstKm) / kmRange;
      
      const startDist = startRatio * totalLength;
      const endDist = endRatio * totalLength;
      
      console.log(`  Distance: ${startDist.toFixed(2)}km - ${endDist.toFixed(2)}km`);

      // Slice the line
      const line = turf.lineString(mainLineFeature.geometry.coordinates);
      const p1 = turf.along(line, startDist, { units: 'kilometers' });
      const p2 = turf.along(line, endDist, { units: 'kilometers' });
      const sliced = turf.lineSlice(p1, p2, line);

      if (sliced) {
        const finalGeojson = {
          ...sliced,
          properties: {
            id: seg.id.toString(),
            nome: segName,
            kmInicial: kmIniInternal,
            kmFinal: kmFimInternal,
            kmInicialKML: sliceStart,
            kmFinalKML: sliceEnd,
            descricao: seg.descricao
          }
        };

        await prisma.segmentoHomogeneo.update({
          where: { id: seg.id },
          data: { geojson: finalGeojson as any }
        });
        
        const len = turf.length(sliced, { units: 'kilometers' });
        console.log(`  -> Updated! Slice Length: ${len.toFixed(2)}km (Expected: ${(sliceEnd - sliceStart).toFixed(2)}km)`);
      } else {
        console.warn(`  -> Failed to slice.`);
      }

    } catch (e) {
      console.error(`  -> Error:`, e);
    }
  }
  
  console.log("\nDone!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
