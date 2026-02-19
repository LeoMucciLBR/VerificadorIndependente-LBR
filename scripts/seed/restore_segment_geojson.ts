
/**
 * Script to RESTORE segment GeoJSON by calling the correct API endpoint
 * which uses SINFRA markers for precise slicing.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const RODOVIA_ID = 8; // MT-246

  console.log("=== RESTORE SEGMENT GEOJSON ===\n");
  console.log("This script will restore segment geojson by calling the correct slicing API.\n");

  // Fetch rodovia to get UUID
  const rodovia = await prisma.rodovia.findUnique({
    where: { id: RODOVIA_ID },
    select: { uuid: true, nome: true }
  });

  if (!rodovia) {
    console.error("Rodovia not found!");
    return;
  }

  console.log(`Rodovia: ${rodovia.nome} (UUID: ${rodovia.uuid})`);

  // Fetch segments to process
  const segments = await prisma.segmentoHomogeneo.findMany({
    where: { rodovia_id: RODOVIA_ID },
    select: {
      id: true,
      nome: true,
      kmInicial: true,
      kmFinal: true,
      kmInicialKML: true,
      kmFinalKML: true
    },
    orderBy: { kmInicial: 'asc' }
  });

  console.log(`Found ${segments.length} segments to restore.\n`);

  // For each segment, call the API to get the correct sliced GeoJSON
  for (const seg of segments) {
    // Use KML values if available, otherwise internal
    const kmIni = seg.kmInicialKML ? Number(seg.kmInicialKML) : Number(seg.kmInicial);
    const kmFim = seg.kmFinalKML ? Number(seg.kmFinalKML) : Number(seg.kmFinal);

    console.log(`[${seg.id}] ${seg.nome}: KM ${kmIni} - ${kmFim}`);

    try {
      // Call the segmentos API which has the correct slicing logic
      const apiUrl = `http://localhost:3000/api/geolocalizacao/segmentos?rodoviaId=${rodovia.uuid}&kmInicial=${kmIni}&kmFinal=${kmFim}`;
      console.log(`   Calling: ${apiUrl}`);
      
      const res = await fetch(apiUrl);
      if (!res.ok) {
        console.error(`   -> API Error: ${res.status} ${res.statusText}`);
        continue;
      }

      const data = await res.json();
      
      if (data.geojson) {
        // Extract the feature for this segment from the response
        let segmentGeoJson: any = null;
        
        if (data.geojson.type === 'FeatureCollection' && data.geojson.features?.length > 0) {
          // Find the feature that matches our segment
          const matchingFeature = data.geojson.features.find((f: any) => 
            f.properties?.kmInicial === kmIni || 
            f.properties?.id === seg.id.toString()
          );
          
          if (matchingFeature) {
            segmentGeoJson = matchingFeature;
          } else {
            // Just use the first line feature
            segmentGeoJson = data.geojson.features.find((f: any) => 
              f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
            );
          }
        } else if (data.geojson.type === 'Feature') {
          segmentGeoJson = data.geojson;
        }

        if (segmentGeoJson) {
          // Update the segment in DB
          await prisma.segmentoHomogeneo.update({
            where: { id: seg.id },
            data: { geojson: segmentGeoJson as any }
          });
          console.log(`   -> RESTORED!`);
        } else {
          console.warn(`   -> No suitable feature found in response.`);
        }
      } else {
        console.warn(`   -> No geojson in response.`);
      }

    } catch (e) {
      console.error(`   -> Error:`, e);
    }
  }

  console.log("\nDone!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
