import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import * as turf from '@turf/turf';
import { extractMainLineString, sliceTraceByKm } from '@/lib/kmz-processor';

// PERFORMANCE: Simplify GeoJSON coordinates to reduce payload size
function simplifyFeatures(features: any[]): any[] {
  return features.map((f: any) => {
    if (!f.geometry) return f;
    const geoType = f.geometry.type;
    if (geoType === 'LineString' || geoType === 'MultiLineString') {
      try {
        const simplified = turf.simplify(f, { tolerance: 0.0001, highQuality: true });
        return { ...simplified, properties: f.properties };
      } catch {
        return f;
      }
    }
    return f;
  });
}

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const rodoviaUuid = searchParams.get("rodoviaId");
    const kmInicialStr = searchParams.get("kmInicial");
    const kmFinalStr = searchParams.get("kmFinal");

    if (!rodoviaUuid) {
      return NextResponse.json(
        { error: "rodoviaId é obrigatório" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 1. BUSCAR RODOVIA (Com GeoJSON atualizado)
    // ---------------------------------------------------------
    let rodovia;
    
    // Check if rodoviaUuid is a valid UUID (simple regex or length check)
    // UUID v4 is 36 chars long
    if (rodoviaUuid.length === 36 && rodoviaUuid.includes('-')) {
        rodovia = await prisma.rodovia.findUnique({
          where: { uuid: rodoviaUuid },
          select: {
            id: true,
            uuid: true,
            nome: true,
            codigo: true,
            concessionaria: true,
            geojson: true, 
            extensao: true
          },
        });
    } else {
        // Assume it's a BigInt ID
        try {
            rodovia = await prisma.rodovia.findUnique({
              where: { id: BigInt(rodoviaUuid) },
              select: {
                id: true,
                uuid: true,
                nome: true,
                codigo: true,
                concessionaria: true,
                geojson: true, 
                extensao: true
              },
            });
        } catch (e) {
            console.error("Invalid Rodovia ID format:", rodoviaUuid);
        }
    }


    if (!rodovia) {
      return NextResponse.json(
        { error: "Rodovia não encontrada" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 2.5 BUSCAR KM INICIAL DA RODOVIA (offset para cálculo de slice)
    // A BR-163 pode começar no KM 868, não no KM 0
    // ---------------------------------------------------------
    let rodoviaKmOffset = 0;
    try {
      const firstSegment = await prisma.segmentoHomogeneo.findFirst({
        where: { rodovia_id: rodovia.id },
        orderBy: { kmInicial: 'asc' },
        select: { kmInicial: true }
      });
      if (firstSegment) {
        rodoviaKmOffset = Number(firstSegment.kmInicial);
      }
    } catch (e) {
      console.error('[API] Error getting rodoviaKmOffset:', e);
    }


    // ---------------------------------------------------------
    // 2. BUSCAR SEGMENTOS (Legacy Table)
    // ---------------------------------------------------------
    const whereClause: any = {
      rodovia_id: rodovia.id,
    };

    if (kmInicialStr && kmFinalStr) {
      const kmInicial = parseFloat(kmInicialStr);
      const kmFinal = parseFloat(kmFinalStr);

      if (isNaN(kmInicial) || isNaN(kmFinal)) {
        return NextResponse.json(
          { error: "KM inicial e final devem ser números válidos" },
          { status: 400 }
        );
      }

      // Allow reversed KM ranges (e.g., segment 23: KM 1129.7→0.6)
      // The pre-computed segment geojson handles these correctly

      whereClause.AND = [
        { kmFinal: { gte: new Decimal(kmInicial) } },
        { kmInicial: { lte: new Decimal(kmFinal) } },
      ];
    }

    const segmentos = await prisma.segmento.findMany({
      where: whereClause,
      select: {
        id: true,
        uuid: true,
        kmInicial: true,
        kmFinal: true,
        descricao: true,
        municipio: true,
        geojson: true,
      },
      orderBy: { kmInicial: "asc" },
    });

    // ---------------------------------------------------------
    // 3. CONSTRUIR TRAÇADO (GeoJSON)
    // ---------------------------------------------------------
    const features: any[] = [];
    let processingFromGeoJson = false;
    let fullTraceFeature: any = null; // Para armazenar o traçado COMPLETO sempre

    // FAST PATH: If KM filter is set, check for pre-computed segment geojson FIRST
    // This avoids loading/parsing the heavy rodovia geojson entirely
    if (kmInicialStr && kmFinalStr) {
        const kmIni = parseFloat(kmInicialStr);
        const kmFim = parseFloat(kmFinalStr);
        
        try {
            const segWithGeo = await prisma.segmentoHomogeneo.findFirst({
                where: {
                    rodovia_id: rodovia.id,
                    OR: [
                        { AND: [{ kmInicial: { gte: kmIni - 0.5, lte: kmIni + 0.5 } }, { kmFinal: { gte: kmFim - 0.5, lte: kmFim + 0.5 } }] },
                        { AND: [{ kmInicialKML: { gte: kmIni - 0.5, lte: kmIni + 0.5 } }, { kmFinalKML: { gte: kmFim - 0.5, lte: kmFim + 0.5 } }] }
                    ]
                },
                select: { id: true, nome: true, geojson: true }
            });

            if (segWithGeo?.geojson) {
                const segGeo = typeof segWithGeo.geojson === 'string' 
                    ? JSON.parse(segWithGeo.geojson) 
                    : segWithGeo.geojson;
                
                if (segGeo?.features?.length > 0) {
                    segGeo.features.forEach((f: any) => features.push({
                        ...f,
                        properties: { ...f.properties, isSelectedSegment: true }
                    }));
                    processingFromGeoJson = true;
                }
            }
        } catch (e) {
            console.warn('[API] Error checking segment geojson:', e);
        }
    }

    // A. TENTATIVA 1: Usar GeoJSON direto da Rodovia (Alta Qualidade)
    // Always extract full trace for background display (rodoviaTrack)
    if (rodovia.geojson && typeof rodovia.geojson === 'object') {
        const fullGeoJson = rodovia.geojson as any;
        
        // SEMPRE extrair a linha completa para o rodoviaTrack
        try {
            const tExtract = Date.now();
            fullTraceFeature = extractMainLineString(fullGeoJson);
        } catch (e) {
            console.error('[API] Error extracting full trace:', e);
        }
        
        // Se temos filtro de KM, tentar cortar o traçado
        if (kmInicialStr && kmFinalStr) {
            try {
                const kmIni = parseFloat(kmInicialStr);
                const kmFim = parseFloat(kmFinalStr);

                // Only attempt slicing if no pre-computed geojson was found
                if (!processingFromGeoJson) {

                // Using top-level imports for performance

                // Extract main line (handles MultiLineString now)
                let mainLineFeature = extractMainLineString(fullGeoJson);

                if (mainLineFeature) {
                    // Extract highway code number (e.g., "246" from "MT-246")
                    const rodoviaCode = rodovia.codigo?.replace(/[^0-9]/g, '');
                    
                    // Get all point markers
                    const allMarkers = fullGeoJson.features.filter((f: any) => f.geometry.type === 'Point' && f.properties?.name);
                    
                    // NO MARKERS IN GEOJSON: Use absolute KM proportional slicing
                    // The geometry covers the FULL road (e.g. BR-163 = ~1145km LineString)
                    // and segments use absolute KM (e.g. KM 868-938).
                    // So we pass the absolute KMs directly - they map proportionally to geometry.
                    if (allMarkers.length === 0) {
                        const lineGeomForSlice = mainLineFeature.geometry.type === 'MultiLineString'
                            ? turf.multiLineString((mainLineFeature.geometry as any).coordinates)
                            : turf.lineString((mainLineFeature.geometry as any).coordinates);
                        const totalLen = turf.length(lineGeomForSlice as any, { units: 'kilometers' });
                        
                        
                        const slicedFeature = sliceTraceByKm(
                            mainLineFeature as any, kmIni, kmFim, totalLen
                        );
                        
                        if (slicedFeature) {
                            features.push(slicedFeature);
                            processingFromGeoJson = true;
                        }
                    } else {
                    // Find SINFRA markers for THIS highway to determine its boundaries
                    const sinframarkersRodovia = allMarkers.filter((m: any) => {
                        const name = (m.properties?.name || '').toUpperCase();
                        return name.includes('SINFRA') && name.includes(`- ${rodoviaCode}/`);
                    });
                    
                    // STEP 0: Pre-slice the full geometry to just this highway's extent using SINFRA markers
                    // This prevents slicing from grabbing geometry from other highways!
                    // BUG FIX: Also handle LineString (not just MultiLineString) - points create LineString!
                    if (sinframarkersRodovia.length >= 2 && (mainLineFeature.geometry.type === 'MultiLineString' || mainLineFeature.geometry.type === 'LineString')) {
                        
                        const tempLineGeom = mainLineFeature.geometry.type === 'MultiLineString'
                            ? turf.multiLineString((mainLineFeature.geometry as any).coordinates)
                            : turf.lineString((mainLineFeature.geometry as any).coordinates);
                        
                        // Get positions of SINFRA markers on the line
                        const sinframPositions = sinframarkersRodovia.map((m: any) => {
                            const snapped = turf.nearestPointOnLine(tempLineGeom as any, m);
                            return snapped.properties.location || 0;
                        });
                        
                        // Get min and max positions (extent of this highway in the full geometry)
                        const minPos = Math.min(...sinframPositions);
                        const maxPos = Math.max(...sinframPositions);
                        
                        
                        // Pre-slice the main line to just this highway's extent
                        try {
                            const totalLength = turf.length(tempLineGeom as any, { units: 'kilometers' });
                            const preSliced = sliceTraceByKm(mainLineFeature as any, minPos, maxPos, totalLength);
                            
                            // Use the pre-sliced line as the new main line
                            mainLineFeature = preSliced as any;
                        } catch (e) {
                            console.warn(`[Pre-slice] Failed to pre-slice, using full geometry:`, e);
                        }
                    }
                    
                    const lineGeom = mainLineFeature!.geometry.type === 'MultiLineString'
                        ? turf.multiLineString((mainLineFeature!.geometry as any).coordinates)
                        : turf.lineString((mainLineFeature!.geometry as any).coordinates);

                     // --- MARKER BASED SLICING (PRIORITY) ---
                     let startPoint: any = null;
                     let endPoint: any = null;

                     // Search for markers in the GeoJSON that match start/end KM
                     // rodovia.geojson includes markers now
                     // HYBRID MARKER FILTERING STRATEGY:
                        // Problem: Most markers (KM 1-247) have NO highway identification in name!
                        // Only 6 SINFRA markers and 3 "KM X (MT XXX)" markers have highway codes.
                        // Solution: Use SINFRA markers + geographic proximity for generic markers
                        
                        let markers = fullGeoJson.features.filter((f: any) => f.geometry.type === 'Point' && f.properties?.name);
                        
                        // rodoviaCode já foi extraído acima no pre-slice
                        
                        // Step 1: Try to find SINFRA markers for this highway
                        const sinframarkers = markers.filter((m: any) => {
                            const name = (m.properties?.name || '').toUpperCase();
                            return name.includes('SINFRA') && name.includes(`- ${rodoviaCode}/`);
                        });
                        
                        // Step 2: Try to find markers with "(MT XXX)" pattern
                        const namedMarkers = markers.filter((m: any) => {
                            if (!rodoviaCode) return false;
                            const name = (m.properties?.name || '').toUpperCase();
                            return (name.includes(`(MT ${rodoviaCode})`) || 
                                    name.includes(`(MT-${rodoviaCode})`) ||
                                    name.includes(`(MT ${rodoviaCode.replace(/^0+/, '')})`)); // Handle "MT 358" vs "MT-358"
                        });
                        
                        // Step 3: Combine SINFRA + named markers
                        let highwayMarkers = [...sinframarkers, ...namedMarkers];
                        
                        // Step 4: If we have some markers, also add nearby generic "KM X" markers
                        if (highwayMarkers.length > 0) {
                            // Generic markers use ABSOLUTE KM numbers (e.g., "KM 115" = absolute KM 115 in project)
                            // Filter by KM number range that matches our kmInicial - kmFinal range
                            // Filter by KM number range that matches our kmInicialKML - kmFinalKML range
                            const genericMarkers = markers.filter((m: any) => {
                                const name = m.properties?.name || '';
                                // Generic marker: starts with "KM" but doesn't have SINFRA or (MT)
                                if (!name.toUpperCase().startsWith('KM')) return false;
                                if (name.includes('SINFRA') || name.includes('(MT')) return false;
                                
                                // Extract KM number from marker name (e.g., "KM 115" -> 115)
                                const kmMatch = name.match(/KM\s*(\d+)/i);
                                if (!kmMatch) return false;
                                const markerKm = parseFloat(kmMatch[1]);
                                
                                // Check if marker KM is within our REAL range (with 10 KM buffer on each side)
                                const buffer = 10;
                                const inRange = markerKm >= (kmIni - buffer) && markerKm <= (kmFim + buffer);
                                
                                if (!inRange) return false;
                                
                                // Also check proximity to highway line (500m tolerance)
                                try {
                                    const markerPoint = turf.point(m.geometry.coordinates);
                                    const nearestOnLine = turf.nearestPointOnLine(lineGeom as any, markerPoint);
                                    const distance = turf.distance(markerPoint, nearestOnLine, { units: 'meters' });
                                    return distance <= 500;
                                } catch (e) {
                                    return false;
                                }
                            });
                            
                            markers = [...highwayMarkers, ...genericMarkers];
                        } else {
                            // Fallback: use all markers within 500m (no SINFRA/named markers found)
                            markers = markers.filter((m: any) => {
                                try {
                                    const markerPoint = turf.point(m.geometry.coordinates);
                                    const nearestOnLine = turf.nearestPointOnLine(lineGeom as any, markerPoint);
                                    const distance = turf.distance(markerPoint, nearestOnLine, { units: 'meters' });
                                    return distance <= 500;
                                } catch (e) {
                                    return false;
                                }
                            });
                            console.warn(`[Markers] No SINFRA/named markers found for ${rodovia.codigo}, using ${markers.length} nearby markers`);
                        }
                        
                        // CLUSTER FILTER: For highways WITHOUT their own SINFRA markers
                        // These highways need extra filtering because pre-slice couldn't run
                        // Apply this AFTER marker selection, regardless of which branch was taken
                        if (sinframarkersRodovia.length === 0 && markers.length > 0) {
                            // Find markers near start KM
                            const startMarkerCandidates = markers.filter((m: any) => {
                                const name = m.properties?.name || '';
                                const kmMatch = name.match(/(\d+)/);
                                if (!kmMatch) return false;
                                const markerKm = parseFloat(kmMatch[1]);
                                return Math.abs(markerKm - kmIni) <= 2;
                            });
                            
                            if (startMarkerCandidates.length >= 1) {
                                // PRIORITY: Use marker with highway code in name (e.g., "KM 0 (MT 480)")
                                let refMarker = startMarkerCandidates.find((m: any) => {
                                    const name = (m.properties?.name || '').toUpperCase();
                                    return name.includes(`(MT ${rodoviaCode})`) || name.includes(`MT ${rodoviaCode}`) || name.includes(`MT-${rodoviaCode}`);
                                });
                                
                                // Fallback to first candidate if no highway-specific marker found
                                if (!refMarker) {
                                    refMarker = startMarkerCandidates[0];
                                } else {
                                }
                                
                                const refLng = refMarker.geometry.coordinates[0];
                                const refLat = refMarker.geometry.coordinates[1];
                                
                                const beforeCount = markers.length;
                                markers = markers.filter((m: any) => {
                                    const lng = m.geometry.coordinates[0];
                                    const lat = m.geometry.coordinates[1];
                                    // For short segments, use tight filter (0.1 deg ≈ 10km)
                                    const segmentLength = kmFim - kmIni;
                                    const tolerance = segmentLength < 10 ? 0.1 : 0.5;
                                    const lngDist = Math.abs(lng - refLng);
                                    const latDist = Math.abs(lat - refLat);
                                    return lngDist <= tolerance && latDist <= tolerance;
                                });
                                
                                const removed = beforeCount - markers.length;
                                if (removed > 0) {
                                }
                            }
                        }
                        
                         // Helper to find nearest marker
                         const findMarker = (targetKm: number) => {
                              // 1. Try exact integer match "KM 40", "KM 41"
                              const kmFloor = Math.floor(targetKm);
                              const kmCeil = Math.ceil(targetKm);
                              
                              const possibleNames = [
                                  `KM ${targetKm}`,
                                  `KM ${kmFloor}`,
                                  `KM ${kmCeil}`,
                                  `KM ${Math.round(targetKm)}`,
                                  `${targetKm}`,
                                  `${kmFloor}`,
                                  `${kmCeil}`
                              ];
                              
                              // Exact name match
                              let match = markers.find((f: any) => 
                                  possibleNames.some(name => f.properties.name?.toUpperCase().includes(name.toUpperCase()))
                              );
                              
                              // 2. Proximity-based fallback: find closest marker by KM number
                              if (!match && markers.length > 0) {
                                  const sortedByKm = markers.slice().sort((a: any, b: any) => {
                                      const aKm = parseFloat(a.properties.name?.match(/\d+\.?\d*/)?.[0] || '999999');
                                      const bKm = parseFloat(b.properties.name?.match(/\d+\.?\d*/)?.[0] || '999999');
                                      return Math.abs(aKm - targetKm) - Math.abs(bKm - targetKm);
                                  });
                                  
                                  const closest = sortedByKm[0];
                                  const closestKm = parseFloat(closest.properties.name?.match(/\d+\.?\d*/)?.[0] || '999999');
                                  if (Math.abs(closestKm - targetKm) <= 2) {
                                      match = closest;
                                  }
                              }
                              
                              return match;
                         };

                         const mStart = findMarker(kmIni);
                         const mEnd = findMarker(kmFim);

                         // Evitar usar o mesmo marcador para início e fim
                         if (mStart && mEnd && mStart === mEnd) {
                             console.warn(`[Slice] Same marker for start/end: ${mStart.properties.name}. Using only start marker.`);
                             // Use SINFRA markers if available
                             if (sinframarkers.length >= 2) {
                                 startPoint = sinframarkers[0];
                                 endPoint = sinframarkers[sinframarkers.length - 1];
                             } else {
                                 startPoint = mStart;
                                 endPoint = null; // Forçar fallback proporcional
                             }
                         } else {
                             if (mStart) startPoint = mStart;
                             if (mEnd) endPoint = mEnd;
                         }
                    
                    let slicedFeature: any = null;
                    let geometryIsReversed = false;

                    if (startPoint && endPoint) {
                         // Slice between markers! Precise.
                         
                         // Snap markers to line (nearestPointOnLine)
                         const snappedStart = turf.nearestPointOnLine(lineGeom as any, startPoint);
                         const snappedEnd = turf.nearestPointOnLine(lineGeom as any, endPoint);
                         
                         // DETECTAR DIREÇÃO DA RODOVIA usando SINFRA markers
                         // Se SINFRA com KM baixo está numa posição MAIOR que SINFRA com KM alto,
                         // significa que a geometria está invertida
                          // means geometry is inverted (High to Low)
                         
                         if (sinframarkers.length >= 2) {
                             // Extrair KM dos SINFRA (formato: "SINFRA - XXX/km,decimal")
                             const sinframWithPos = sinframarkers.map((m: any) => {
                                 const name = m.properties?.name || '';
                                 // Formato: "SINFRA - 246/112,21" -> pegar 112,21 (depois da barra)
                                 const kmMatch = name.match(/\/(\d+)[,.]?(\d*)/);
                                 const km = kmMatch ? parseFloat(kmMatch[1] + '.' + (kmMatch[2] || '0')) : 0;
                                 const snapped = turf.nearestPointOnLine(lineGeom as any, m);
                                 return { km, position: snapped.properties.location || 0, name };
                             }).sort((a: { km: number; position: number; name: string }, b: { km: number; position: number; name: string }) => a.km - b.km); // Ordenar por KM crescente
                             
                             if (sinframWithPos.length >= 2) {
                                 const lowKmMarker = sinframWithPos[0];  // KM mais baixo
                                 const highKmMarker = sinframWithPos[sinframWithPos.length - 1]; // KM mais alto
                                 
                                 // Se KM baixo está numa posição MAIOR na geometria, está invertido
                                 geometryIsReversed = lowKmMarker.position > highKmMarker.position;
                             }
                         }
                         
                         // Handle MultiLineString by using distances instead of lineSlice
                         const isMulti = mainLineFeature!.geometry.type === 'MultiLineString';
                         if (isMulti) {
                             // For MultiLineString, get distances and use sliceTraceByKm
                             let startDist = snappedStart.properties.location || 0;
                             let endDist = snappedEnd.properties.location || turf.length(lineGeom as any, { units: 'kilometers' });
                             
                             // Se a geometria está invertida, precisamos inverter a lógica de slice
                             // A geometria vai de KM alto para KM baixo, então:
                             // - Para pegar KM 112-153, precisamos ir de 153 (menor posição) para 112 (maior posição)
                             if (geometryIsReversed) {
                                 // startDist e endDist já estão corretos mas em ordem inversa
                                 // Não trocar - queremos manter a ordem baseada nos marcadores
                             } else {
                                 // Ensure startDist < endDist for normal direction
                                 if (startDist > endDist) {
                                     [startDist, endDist] = [endDist, startDist];
                                 }
                             }
                             
                             
                             slicedFeature = sliceTraceByKm(
                                 mainLineFeature as any,
                                 Math.min(startDist, endDist),
                                 Math.max(startDist, endDist),
                                 turf.length(lineGeom as any, { units: 'kilometers' })
                             );
                         } else {
                             // Use lineSlice for simple LineString
                             slicedFeature = turf.lineSlice(snappedStart, snappedEnd, lineGeom as any);
                         }
                    } else {
                        // --- PROPORTIONAL FALLBACK ---
                        
                        const totalLen = turf.length(lineGeom as any, { units: 'kilometers' });
                        
                        // IMPORTANTE: Converter KM absolutos para KM relativos ao início da rodovia
                        // Se BR-163 começa no KM 868, kmIni=868 vira kmIniRelativo=0
                        const kmIniRelativo = kmIni - rodoviaKmOffset;
                        const kmFimRelativo = kmFim - rodoviaKmOffset;
                        

                        // Use shared slicing logic which supports MultiLineString
                        slicedFeature = sliceTraceByKm(
                            mainLineFeature as any, 
                            kmIniRelativo, 
                            kmFimRelativo, 
                            totalLen
                        );
                    }


                    if (slicedFeature) {
                        // Primeiro, filtrar os pontos corretos do segmento
                        const pointFeatures = markers.filter((f: any) => {
                            if (f.geometry.type !== 'Point') return false;
                            const name = f.properties?.name || '';
                            const kmMatch = name.match(/KM\s*(\d+)/i);
                            if (kmMatch) {
                                const markerKm = parseFloat(kmMatch[1]);
                                return markerKm >= kmIni && markerKm <= kmFim;
                            }
                            // Incluir SINFRA markers se estiverem no range
                            const sinfraMatch = name.match(/\/(\d+)[,.]?(\d*)/);
                            if (sinfraMatch) {
                                const sinfraKm = parseFloat(sinfraMatch[1] + '.' + (sinfraMatch[2] || '0'));
                                return sinfraKm >= kmIni && sinfraKm <= kmFim;
                            }
                            return false;
                        });
                        
                        // VALIDAÇÃO: Verificar se o traçado está próximo dos pontos
                        // Se o traçado tem geometria muito longe dos pontos, usar os pontos para criar o traçado
                        let usePointsAsTrace = false;
                        
                        if (pointFeatures.length >= 2 && slicedFeature.geometry) {
                            try {
                                // Calcular centroide dos pontos
                                const pointCoords = pointFeatures.map((p: any) => p.geometry.coordinates);
                                const centerLng = pointCoords.reduce((sum: number, c: any) => sum + c[0], 0) / pointCoords.length;
                                const centerLat = pointCoords.reduce((sum: number, c: any) => sum + c[1], 0) / pointCoords.length;
                                
                                // Calcular comprimento esperado baseado nos pontos (distância entre primeiro e último)
                                const firstPoint = turf.point(pointCoords[0]);
                                const lastPoint = turf.point(pointCoords[pointCoords.length - 1]);
                                const expectedLength = turf.distance(firstPoint, lastPoint, { units: 'kilometers' });
                                
                                // Calcular comprimento do traçado
                                const slicedLine = slicedFeature.geometry.type === 'LineString' 
                                    ? turf.lineString(slicedFeature.geometry.coordinates)
                                    : slicedFeature.geometry.type === 'MultiLineString'
                                    ? turf.multiLineString(slicedFeature.geometry.coordinates)
                                    : null;
                                    
                                if (slicedLine) {
                                    const actualLength = turf.length(slicedLine, { units: 'kilometers' });
                                    
                                    // Se o traçado é muito maior que o esperado (mais de 2x), usar pontos
                                    if (actualLength > expectedLength * 3 && expectedLength > 0.5) {
                                        usePointsAsTrace = true;
                                    }
                                }
                            } catch (e) {
                                console.warn('[Trace Validation] Error:', e);
                            }
                        }
                        
                        if (usePointsAsTrace && pointFeatures.length >= 2) {
                            // Construir traçado a partir dos pontos (ordenados por posição na linha)
                            
                            // Ordenar pontos por nome de KM
                            const orderedPoints = pointFeatures.sort((a: any, b: any) => {
                                const aKm = parseFloat((a.properties?.name || '').match(/\d+/)?.[0] || '0');
                                const bKm = parseFloat((b.properties?.name || '').match(/\d+/)?.[0] || '0');
                                return aKm - bKm;
                            });
                            
                            const lineCoords = orderedPoints.map((p: any) => p.geometry.coordinates);
                            
                            if (lineCoords.length >= 2) {
                                const pointBasedTrace = turf.lineString(lineCoords, {
                                    descricao: `Trecho KM ${kmIni} - ${kmFim}`,
                                    isReference: true
                                });
                                features.push(pointBasedTrace);
                            }
                        } else {
                            // Usar traçado fatiado normalmente
                            features.push({
                                ...slicedFeature,
                                properties: {
                                    ...slicedFeature.properties,
                                    descricao: `Trecho KM ${kmIni} - ${kmFim}`,
                                    isReference: true,
                                    isReversed: geometryIsReversed
                                }
                            });
                        }
                        
                        // Adicionar os pontos ao resultado
                        pointFeatures.forEach((p: any) => features.push(p));
                        
                        processingFromGeoJson = true;
                    }
                } // Close 'if (slicedFeature)' and 'if (mainLineFeature)'
                } // Close 'else' for marker-based processing
                } // Close 'if (!processingFromGeoJson)'
            } catch (e) {
                console.error("Erro ao cortar GeoJSON (SliceTrace), exibindo completo:", e);
                // fall through to show full trace or legacy
            }
        } else {
            // SEM FILTRO DE KM: Usar a linha principal extraída do GeoJSON
            
            try {
                
                let mainLineFeature = extractMainLineString(fullGeoJson);
                
                if (mainLineFeature) {
                    features.push({
                        ...mainLineFeature,
                        properties: {
                            ...mainLineFeature.properties,
                            descricao: 'Traçado Completo',
                            isReference: true
                        }
                    });
                    processingFromGeoJson = true;
                } else {
                }
            } catch (e) {
                console.error('[API] Error extracting main line:', e);
            }
        }
        
        // Se não conseguiu processar, usar GeoJSON completo como fallback
        if (!processingFromGeoJson) {
            if (fullGeoJson.type === 'FeatureCollection') {
                fullGeoJson.features.forEach((f: any) => features.push(f));
            } else {
                features.push(fullGeoJson);
            }
            processingFromGeoJson = true;
        }
    }

    // B. TENTATIVA 2: Legacy - Construir linha ligando Marcos Quilométricos
    if (!processingFromGeoJson) {
        
        const whereMarcos: any = { rodovia_id: rodovia.id };
        
        // Aplicar filtro de KM (com buffer para visualização)
        if (kmInicialStr && kmFinalStr) {
            const kIni = parseFloat(kmInicialStr);
            const kFim = parseFloat(kmFinalStr);
            if (!isNaN(kIni) && !isNaN(kFim)) {
                whereMarcos.km = {
                    gte: Math.max(0, kIni - 2), 
                    lte: kFim + 2
                };
            }
        }

        const marcos = await prisma.marcoQuilometrico.findMany({
            where: whereMarcos,
            orderBy: { km: "asc" } 
        });

        // Agrupar por segmento (pistas/alças)
        const marcosPorSegmento = new Map<string, any[]>();
        marcos.forEach((m) => {
            const segName = m.segmento_origem || "Principal";
            if (!marcosPorSegmento.has(segName)) {
                marcosPorSegmento.set(segName, []);
            }
            marcosPorSegmento.get(segName)!.push(m);
        });

        const MAX_GAP_DEG = 0.5;
        const MAIN_TRACK_KEYWORDS = ["eixo", "pista", "norte", "sul", "leste", "oeste", "crescente", "decrescente", "principal", "rodovia", "sentido"];
        const POINT_ONLY_KEYWORDS = ['ppd', 'pedagio', 'praca', 'camera', 'radar', 'acesso', 'retorno', 'entroncamento', 'trevo', 'fxad', 'faixa', 'ponte', 'viaduto', 'oae', 'tunel', 'bueiro', 'drenagem', 'radar'];

        for (const [segName, grupoMarcos] of marcosPorSegmento.entries()) {
            if (grupoMarcos.length === 0) continue;

            const isMainTrack = MAIN_TRACK_KEYWORDS.some(k => segName.toLowerCase().includes(k));
            const isPointOnly = POINT_ONLY_KEYWORDS.some(k => segName.toLowerCase().includes(k));

            // Micro-filtragem (Centróides)
            const microBuckets = new Map<number, { sumLat: number, sumLng: number, count: number, km: number }>();
            grupoMarcos.forEach((m) => {
                 const kmBucket = Math.floor(parseFloat(m.km.toString()) * 10) / 10;
                 if (!microBuckets.has(kmBucket)) {
                     microBuckets.set(kmBucket, { sumLat: 0, sumLng: 0, count: 0, km: kmBucket });
                 }
                 const b = microBuckets.get(kmBucket)!;
                 b.sumLat += parseFloat(m.latitude.toString());
                 b.sumLng += parseFloat(m.longitude.toString());
                 b.count++;
            });
            const sortedCentroids = Array.from(microBuckets.values())
                .map(b => ({
                    lat: b.sumLat / b.count,
                    lng: b.sumLng / b.count,
                    km: b.km
                }))
                .sort((a, b) => a.km - b.km);

            const forceLine = grupoMarcos.length > 20 && !isPointOnly;

            if ((isMainTrack || forceLine) && !isPointOnly && sortedCentroids.length >= 2) {
                // ... (Lógica de construção de linha igual à anterior)
                let currentSegment: number[][] = [];
                let lastPoint: { lat: number, lng: number, km: number } | null = null;
                let segmentStartKm = sortedCentroids.length > 0 ? sortedCentroids[0].km : 0;

                sortedCentroids.forEach((pt) => {
                    if (!lastPoint) {
                        currentSegment.push([pt.lng, pt.lat]);
                        lastPoint = pt;
                        segmentStartKm = pt.km;
                        return;
                    }

                    const dist = Math.sqrt(Math.pow(pt.lat - lastPoint.lat, 2) + Math.pow(pt.lng - lastPoint.lng, 2));

                    if (dist > MAX_GAP_DEG) {
                        if (currentSegment.length > 1) {
                            features.push({
                                type: "Feature",
                                geometry: { type: "LineString", coordinates: currentSegment },
                                properties: {
                                    descricao: segName,
                                    kmInicial: segmentStartKm,
                                    kmFinal: lastPoint.km,
                                    uuid: `tracado-${segName}-${segmentStartKm}`,
                                    isReference: true,
                                    segmentoOrigem: segName
                                }
                            });
                        }
                        currentSegment = [[pt.lng, pt.lat]];
                        segmentStartKm = pt.km;
                    } else {
                        currentSegment.push([pt.lng, pt.lat]);
                    }
                    lastPoint = pt;
                });

                if (currentSegment.length > 1 && lastPoint) {
                    features.push({
                         type: "Feature",
                         geometry: { type: "LineString", coordinates: currentSegment },
                         properties: {
                             descricao: segName,
                             kmInicial: segmentStartKm,
                             kmFinal: (lastPoint as { km: number }).km,
                             uuid: `tracado-${segName}-${segmentStartKm}`,
                             isReference: true,
                             segmentoOrigem: segName
                         }
                    });
                }
            } else {
                 // Pontos
                 grupoMarcos.forEach((m) => {
                    const cleanName = m.nome.replace(/\s/g, '');
                    const isPureKMMarker = /^\d+(\+\d+)?$/.test(cleanName);
                    const CRITICAL_KEYWORDS_VISUAL = ['ppd', 'pedagio', 'praca', 'camera', 'radar', 'acesso', 'retorno', 'entroncamento', 'trevo', 'fxad', 'faixa', 'ponte', 'viaduto', 'oae', 'tunel'];
                    const isCritical = CRITICAL_KEYWORDS_VISUAL.some(k => m.nome.toLowerCase().includes(k) || segName.toLowerCase().includes(k));

                    if (isPureKMMarker && !isCritical) return;

                    features.push({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [parseFloat(m.longitude.toString()), parseFloat(m.latitude.toString())] },
                        properties: {
                            descricao: m.nome,
                            kmInicial: parseFloat(m.km.toString()),
                            uuid: m.uuid,
                            isReference: true,
                            isPoint: true,
                            segmentoOrigem: segName
                        }
                    });
                });
            }
        }
    }

    // FALLBACK: Se features não contém nenhuma LineString VÁLIDA, buscar geojson do segmento homogêneo
    // Isso corrige rodovias como MT-480 que têm geojson somente com Points e sem traçado,
    // OU quando o slicing pega markers da rodovia errada (ex: KM 0-3 da MT-358 em vez da MT-480)
    const lineFeatures = features.filter((f: any) => 
        f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
    );
    const pointFeatures = features.filter((f: any) => f.geometry?.type === 'Point');
    
    let lineTraceIsInvalid = lineFeatures.length === 0;
    
    // Verificar se a LineString está geograficamente próxima dos markers específicos da rodovia
    if (lineFeatures.length > 0 && pointFeatures.length > 0) {
        // Encontrar markers com nome da rodovia (ex: "KM 0 (MT 480)")
        const rodoviaCode = rodovia.codigo?.replace(/[^0-9]/g, '') || '';
        const specificMarkers = pointFeatures.filter((f: any) => {
            const name = (f.properties?.descricao || f.properties?.name || '').toUpperCase();
            return name.includes(`MT ${rodoviaCode}`) || name.includes(`MT-${rodoviaCode}`) || name.includes(`(MT ${rodoviaCode})`);
        });
        
        if (specificMarkers.length > 0) {
            // Calcular centro dos markers específicos
            const markerCenter = specificMarkers.reduce((acc: any, f: any) => {
                acc.lng += f.geometry.coordinates[0];
                acc.lat += f.geometry.coordinates[1];
                return acc;
            }, { lng: 0, lat: 0 });
            markerCenter.lng /= specificMarkers.length;
            markerCenter.lat /= specificMarkers.length;
            
            // Calcular centro da LineString
            const lineCoords = lineFeatures[0].geometry.type === 'LineString' 
                ? lineFeatures[0].geometry.coordinates 
                : lineFeatures[0].geometry.coordinates[0];
            const lineCenter = lineCoords.reduce((acc: any, c: any) => {
                acc.lng += c[0]; acc.lat += c[1]; return acc;
            }, { lng: 0, lat: 0 });
            lineCenter.lng /= lineCoords.length;
            lineCenter.lat /= lineCoords.length;
            
            // Se centros estão a mais de ~10km (0.1 graus), a LineString é errada
            const dist = Math.sqrt(
                Math.pow(lineCenter.lng - markerCenter.lng, 2) + 
                Math.pow(lineCenter.lat - markerCenter.lat, 2)
            );
            
            if (dist > 0.1) {
                lineTraceIsInvalid = true;
            }
        }
    }
    
    
    if (lineTraceIsInvalid && kmInicialStr && kmFinalStr) {
        try {
            const kmIni = parseFloat(kmInicialStr);
            const kmFim = parseFloat(kmFinalStr);
            
            // Buscar segmento homogêneo que corresponda ao range de KM
            const segHomogeneo = await prisma.segmentoHomogeneo.findFirst({
                where: {
                    rodovia_id: rodovia.id,
                    OR: [
                        // Match por KM normal
                        { AND: [{ kmInicial: { lte: kmIni + 0.5 } }, { kmFinal: { gte: kmFim - 0.5 } }] },
                        // Match por KML
                        { AND: [{ kmInicialKML: { lte: kmIni + 0.5 } }, { kmFinalKML: { gte: kmFim - 0.5 } }] }
                    ]
                },
                select: { id: true, nome: true, geojson: true }
            });
            
            if (segHomogeneo?.geojson) {
                const segGeo = typeof segHomogeneo.geojson === 'string' 
                    ? JSON.parse(segHomogeneo.geojson) 
                    : segHomogeneo.geojson;
                
                if (segGeo.type === 'Feature' && segGeo.geometry) {
                    // Limpar features existentes (somente pontos errados) e adicionar o traçado correto
                    features.length = 0;
                    features.push({
                        ...segGeo,
                        properties: {
                            ...segGeo.properties,
                            descricao: segHomogeneo.nome,
                            isReference: true
                        }
                    });
                } else if (segGeo.type === 'FeatureCollection') {
                    features.length = 0;
                    segGeo.features.forEach((f: any) => features.push(f));
                }
            } else {
            }
        } catch (e) {
            console.error('[API] Error in segmento homogêneo fallback:', e);
        }
    }

    // Adicionar trace de segmentos manuais se existirem
    segmentos.forEach((seg: any) => {
      if (seg.geojson && typeof seg.geojson === 'object') {
        const geojson = seg.geojson as any;
        if (geojson.type === 'Feature') {
          features.push({ ...geojson, properties: { ...geojson.properties, uuid: seg.uuid } });
        } else if (geojson.type === 'FeatureCollection') {
          geojson.features.forEach((f: any) => features.push(f));
        }
      }
    });

    const tracadoCompleto = {
      type: 'FeatureCollection',
      features: features.length > 0 ? features : [],
    };
    
    // PERFORMANCE: Simplify fullTrace too, and avoid duplicating when identical
    const rodoviaTrack = fullTraceFeature 
      ? { type: 'FeatureCollection', features: simplifyFeatures([fullTraceFeature]) }
      : tracadoCompleto;
    

    // ---------------------------------------------------------
    // 4. SERIALIZAR E RESPONDER
    // ---------------------------------------------------------
    const serializedSegmentos = segmentos.map((seg: any) => ({
      ...seg,
      id: seg.id.toString(),
      kmInicial: parseFloat(seg.kmInicial.toString()),
      kmFinal: parseFloat(seg.kmFinal.toString()),
      geojson: seg.geojson || null,
    }));
    
    return NextResponse.json(
      {
        rodovia: {
          id: rodovia.id.toString(),
          uuid: rodovia.uuid,
          nome: rodovia.nome,
          codigo: rodovia.codigo,
          concessionaria: rodovia.concessionaria,
        },
        segmentos: serializedSegmentos,
        tracadoCompleto,
        rodoviaTrack,
        filtroAplicado: !!(kmInicialStr && kmFinalStr),
        kmInicial: kmInicialStr ? parseFloat(kmInicialStr) : null,
        kmFinal: kmFinalStr ? parseFloat(kmFinalStr) : null,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching segmentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar segmentos" },
      { status: 500 }
    );
  }
}
