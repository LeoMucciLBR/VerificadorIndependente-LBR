
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log("Checking Rodovia Table (Master Trace Source)...");
  
  const rodovias = await prisma.rodovia.findMany({
    select: { id: true, nome: true, geojson: true }
  });

  console.log(`Total Rodovias: ${rodovias.length}`);

  rodovias.forEach(r => {
    const hasGeojson = r.geojson && Object.keys(r.geojson as any).length > 0;
    console.log(`ID: ${r.id}, Nome: ${r.nome}`);
    console.log(`Has GeoJSON: ${hasGeojson ? 'YES' : 'NO'}`);
    if (hasGeojson) {
       console.log(`GeoJSON Type: ${typeof r.geojson}`);
       const g = r.geojson as any;
       console.log(`Feature Type: ${g.type}`);
       if (g.type === 'FeatureCollection') {
           console.log(`Features count: ${g.features?.length}`);
       }
    }
  });
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
