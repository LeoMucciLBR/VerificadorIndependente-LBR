
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedData() {
  console.log('Seeding fake segment data...');

  // 1. Get SP-330
  const rodovia = await prisma.rodovia.findFirst({
    where: { nome: 'SP-330' }
  });

  if (!rodovia) {
    console.log('Rodovia SP-330 not found, aborting.');
    return;
  }

  console.log(`Seeding segments for ${rodovia.nome} (ID: ${rodovia.id})...`);

  // Delete existing segments just in case to avoid dups logic complexity for this test
  // await prisma.segmento.deleteMany({ where: { rodovia_id: rodovia.id } });

  // Create Segment 1: KM 10 - KM 20
  await prisma.segmento.create({
    data: {
      uuid: 'seed-seg-001',
      rodovia_id: rodovia.id,
      kmInicial: 10.0,
      kmFinal: 20.0,
      descricao: 'Trecho São Paulo - Osasco',
      municipio: 'São Paulo',
      geojson: {
        type: 'LineString',
        coordinates: [
          [-46.7, -23.5], // Start
          [-46.72, -23.48],
          [-46.74, -23.46],
          [-46.76, -23.44] // End
        ]
      }
    }
  });

  // Create Segment 2: KM 20 - KM 30
  await prisma.segmento.create({
    data: {
      uuid: 'seed-seg-002',
      rodovia_id: rodovia.id,
      kmInicial: 20.0,
      kmFinal: 30.0,
      descricao: 'Trecho Osasco - Cajamar',
      municipio: 'Osasco',
      geojson: {
        type: 'LineString',
        coordinates: [
          [-46.76, -23.44], // Start (connects with prev)
          [-46.78, -23.42],
          [-46.80, -23.40],
          [-46.82, -23.38] // End
        ]
      }
    }
  });
  
    // Create Segment 3: KM 30 - KM 40
  await prisma.segmento.create({
    data: {
      uuid: 'seed-seg-003',
      rodovia_id: rodovia.id,
      kmInicial: 30.0,
      kmFinal: 40.0,
      descricao: 'Trecho Cajamar - Jundiaí',
      municipio: 'Cajamar',
      geojson: {
        type: 'LineString',
        coordinates: [
          [-46.82, -23.38], 
          [-46.85, -23.35],
          [-46.88, -23.32],
          [-46.91, -23.30] 
        ]
      }
    }
  });

  console.log('Seeding completed!');
}

seedData()
  .catch(e => {
      // Ignore unique constraint errors if already seeded
      if (e.code === 'P2002') {
          console.log('Data already exists, skipping.');
      } else {
          console.error(e);
      }
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
