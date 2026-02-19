const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  let report = '=== SEGMENT-HIGHWAY ASSIGNMENT REPORT ===\n\n';
  
  // Get all highways
  const highways = await prisma.rodovia.findMany({
    where: { project_id: BigInt(1) },
    select: { id: true, codigo: true, nome: true },
    orderBy: { id: 'asc' }
  });
  
  report += 'Available Highways:\n';
  highways.forEach(h => {
    report += `  - ID ${h.id}: ${h.codigo} (${h.nome})\n`;
  });
  report += '\n';
  
  // Get segments
  const segments = await prisma.segmentoHomogeneo.findMany({
    where: { id: { in: [12,13,14,15,16,17,18,19,20,21,22].map(BigInt) } },
    select: {
      id: true,
      nome: true,
      kmInicial: true,
      kmFinal: true,
      kmInicialKML: true,
      kmFinalKML: true,
      rodovia_id: true,
      rodovias: { select: { id: true, codigo: true, nome: true } }
    },
    orderBy: { id: 'asc' }
  });
  
  report += 'Current Segments:\n';
  segments.forEach(s => {
    report += `\nID ${s.id}: "${s.nome}"\n`;
    report += `  -> Assigned to: Highway ID ${s.rodovia_id} (${s.rodovias.codigo})\n`;
    report += `  -> DB KMs: ${s.kmInicial} - ${s.kmFinal}\n`;
    report += `  -> KML KMs: ${s.kmInicialKML || 'NULL'} - ${s.kmFinalKML || 'NULL'}\n`;
  });
  
  // Expected assignments from SQL
  const expected = {
    12: { highway: 'MT-246', name: 'Segmento 1' },
    13: { highway: 'MT-246', name: 'Segmento 2' },
    14: { highway: 'MT-246', name: 'Segmento 3 (MT 246/343)' },
    15: { highway: 'MT-343', name: 'Segmento 4' },
    16: { highway: 'MT-343', name: 'Segmento 5 (MT 343/358)' },
    17: { highway: 'MT-358', name: 'Segmento 6' },
    18: { highway: 'MT-358', name: 'Segmento 7' },
    19: { highway: 'MT-358', name: 'Segmento 8' },
    20: { highway: 'MT-358', name: 'Segmento 9' },
    21: { highway: 'MT-358', name: 'Segmento 10' },
    22: { highway: 'MT-480', name: 'Segmento 11' }
  };
  
  report += '\n\n=== ANALYSIS ===\n';
  segments.forEach(s => {
    const exp = expected[Number(s.id)];
    const actualCode = s.rodovias.codigo.replace(/[^0-9]/g, '');
    const expectedCode = exp.highway.replace(/[^0-9]/g, '');
    const match = actualCode === expectedCode;
    const status = match ? '✅ CORRECT' : '❌ WRONG';
    
    report += `\n${status} | Seg ${s.id}`;
    report += `\n  Expected: ${exp.highway}`;
    report += `\n  Got: ${s.rodovias.codigo} (ID ${s.rodovia_id})\n`;
  });
  
  fs.writeFileSync('segment-report.txt', report, 'utf8');
  console.log('✅ Report saved to segment-report.txt');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
