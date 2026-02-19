import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import prisma from '@/lib/prisma';
import {
  extractMainLineString,
  extractMarkers,
  geojsonToKML,
  createKMZ,
} from '@/lib/kmz-processor';
import * as turf from '@turf/turf';
import { lineSlice } from '@turf/line-slice';

/**
 * Extrai o código da rodovia de um marcador SINFRA
 * Ex: "SINFRA - 358/126,72" -> { codigo: "358", km: 126.72 }
 */
function parseSinfraMarker(name: string): { codigo: string; km: number } | null {
  const match = name.match(/SINFRA\s*-\s*(\d+)\/(\d+)[,.]?(\d*)/i);
  if (!match) return null;
  const codigo = match[1];
  const km = parseFloat(match[2] + '.' + (match[3] || '0'));
  return { codigo, km };
}

/**
 * Extrai código da rodovia de marcadores genéricos como "KM 0 (MT 480)"
 */
function parseGenericMTMarker(name: string): { codigo: string; km: number } | null {
  const match = name.match(/KM\s*(\d+)\s*\(MT[\s-]?(\d+)\)/i);
  if (!match) return null;
  return { codigo: match[2], km: parseFloat(match[1]) };
}

/**
 * Encontra o ponto mais próximo na linha para um marcador
 */
function findNearestPointOnLine(
  line: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>,
  point: GeoJSON.Feature<GeoJSON.Point>
): { point: GeoJSON.Feature<GeoJSON.Point>; distance: number } | null {
  try {
    const nearest = turf.nearestPointOnLine(line as any, point);
    const distance = turf.distance(point, nearest, { units: 'meters' });
    return { point: nearest, distance };
  } catch (e) {
    return null;
  }
}

/**
 * Agrupa marcadores por código de rodovia
 */
function groupMarkersByRodovia(markers: GeoJSON.Feature<GeoJSON.Point>[]): Map<string, { marker: GeoJSON.Feature<GeoJSON.Point>; km: number }[]> {
  const groups = new Map<string, { marker: GeoJSON.Feature<GeoJSON.Point>; km: number }[]>();
  
  for (const marker of markers) {
    const name = marker.properties?.name || '';
    
    // Tentar SINFRA primeiro
    let parsed = parseSinfraMarker(name);
    if (!parsed) {
      // Tentar formato genérico "KM X (MT YYY)"
      parsed = parseGenericMTMarker(name);
    }
    
    if (parsed) {
      const key = parsed.codigo;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ marker, km: parsed.km });
    }
  }
  
  return groups;
}

/**
 * Extrai a geometria de uma rodovia específica usando seus marcadores SINFRA
 */
function extractRodoviaGeometry(
  mainLine: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>,
  rodoviaMarkers: { marker: GeoJSON.Feature<GeoJSON.Point>; km: number }[],
  allMarkers: GeoJSON.Feature<GeoJSON.Point>[]
): GeoJSON.FeatureCollection | null {
  if (rodoviaMarkers.length < 1) return null;
  
  // Ordenar por KM
  rodoviaMarkers.sort((a, b) => a.km - b.km);
  
  // Pegar primeiro e último marcador
  const startMarker = rodoviaMarkers[0];
  const endMarker = rodoviaMarkers[rodoviaMarkers.length - 1];
  
  
  try {
    // Encontrar pontos na linha mais próximos dos marcadores
    const startNearest = findNearestPointOnLine(mainLine, startMarker.marker);
    const endNearest = findNearestPointOnLine(mainLine, endMarker.marker);
    
    if (!startNearest || !endNearest) {
      console.warn('[ExtractRodovia] Could not find nearest points on line');
      return null;
    }
    
    // Verificar se os pontos estão próximos o suficiente da linha (500m)
    if (startNearest.distance > 500 || endNearest.distance > 500) {
      console.warn(`[ExtractRodovia] Markers too far from line: ${startNearest.distance}m, ${endNearest.distance}m`);
      return null;
    }
    
    // Fatiar a linha entre os dois pontos
    let slicedLine: GeoJSON.Feature<GeoJSON.LineString>;
    
    if (mainLine.geometry.type === 'LineString') {
      slicedLine = lineSlice(startNearest.point, endNearest.point, mainLine as any);
    } else {
      // Para MultiLineString, precisamos converter para LineString primeiro ou fatiar cada parte
      // Simplificação: flatten para LineString contínuo
      const coords: number[][] = [];
      for (const lineCoords of mainLine.geometry.coordinates) {
        coords.push(...lineCoords);
      }
      const flatLine = turf.lineString(coords);
      slicedLine = lineSlice(startNearest.point, endNearest.point, flatLine);
    }
    
    // Filtrar marcadores que estão próximos desta linha
    const nearbyMarkers = allMarkers.filter(m => {
      try {
        const nearest = turf.nearestPointOnLine(slicedLine as any, m);
        const dist = turf.distance(m, nearest, { units: 'meters' });
        return dist <= 500;
      } catch {
        return false;
      }
    });
    
    return {
      type: 'FeatureCollection',
      features: [slicedLine, ...nearbyMarkers]
    };
    
  } catch (e) {
    console.error('[ExtractRodovia] Error:', e);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Find project with GeoJSON
    const project = await prisma.projects.findUnique({
      where: { uuid: projectId },
      include: {
        rodovias: {
          include: {
            segmentos_homogeneos: {
              orderBy: { kmInicial: 'asc' }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.geojson) {
      return NextResponse.json(
        { error: 'Project has no GeoJSON data. Please upload a KMZ file first.' },
        { status: 400 }
      );
    }

    const projectGeojson = project.geojson as unknown as GeoJSON.FeatureCollection;
    const mainLine = extractMainLineString(projectGeojson);
    const markers = extractMarkers(projectGeojson);

    if (!mainLine) {
      return NextResponse.json(
        { error: 'Could not extract main LineString from project GeoJSON' },
        { status: 400 }
      );
    }

    // Agrupar marcadores por código de rodovia
    const markersByRodovia = groupMarkersByRodovia(markers);

    const results = {
      rodovias: [] as any[],
      segmentos: [] as any[]
    };

    // Process each rodovia
    for (const rodovia of project.rodovias) {
      try {
        // Extrair código da rodovia do nome (ex: "MT-358" -> "358")
        const codigoMatch = rodovia.nome?.match(/(\d{3})/);
        const codigo = codigoMatch ? codigoMatch[1] : rodovia.codigo?.replace(/\D/g, '');
        
        if (!codigo) {
          continue;
        }
        
        
        // Buscar marcadores para esta rodovia
        const rodoviaMarkers = markersByRodovia.get(codigo) || [];
        
        let rodoviaGeojson: GeoJSON.FeatureCollection;
        
        if (rodoviaMarkers.length >= 1) {
          // Usar marcadores SINFRA para extrair geometria específica
          const extracted = extractRodoviaGeometry(mainLine, rodoviaMarkers, markers);
          if (extracted) {
            rodoviaGeojson = extracted;
          } else {
            // Fallback: usar traçado completo
            rodoviaGeojson = {
              type: 'FeatureCollection',
              features: [mainLine, ...markers]
            };
            console.warn(`[Process] Could not extract geometry for ${rodovia.nome}, using full trace`);
          }
        } else {
          // Sem marcadores SINFRA, usar traçado completo com marcadores próximos
          rodoviaGeojson = {
            type: 'FeatureCollection',
            features: [mainLine, ...markers]
          };
        }

        // Generate KML and KMZ for rodovia
        const kmlString = geojsonToKML(rodoviaGeojson);
        const kmzBuffer = await createKMZ(kmlString);

        // Save rodovia KMZ
        const rodoviaDir = join(process.cwd(), 'public', 'uploads', 'kmz', 'rodovias', rodovia.id.toString());
        if (!existsSync(rodoviaDir)) {
          await mkdir(rodoviaDir, { recursive: true });
        }

        const rodoviaKmzPath = join(rodoviaDir, 'trace.kmz');
        await writeFile(rodoviaKmzPath, kmzBuffer);

        const rodoviaKmzUrl = `/uploads/kmz/rodovias/${rodovia.id}/trace.kmz`;

        // Update rodovia with GeoJSON and KML URL
        await prisma.rodovia.update({
          where: { id: rodovia.id },
          data: {
            kmlUrl: rodoviaKmzUrl,
            geojson: rodoviaGeojson as any,
            updatedAt: new Date()
          }
        });

        // Calcular extensão da rodovia
        const segments = rodovia.segmentos_homogeneos;
        const kmInicial = segments.length > 0 ? Math.min(...segments.map(s => Number(s.kmInicial))) : 0;
        const kmFinal = segments.length > 0 ? Math.max(...segments.map(s => Number(s.kmFinal))) : 0;

        results.rodovias.push({
          id: rodovia.uuid,
          nome: rodovia.nome,
          codigo,
          kmInicial,
          kmFinal,
          markersFound: rodoviaMarkers.length,
          kmlUrl: rodoviaKmzUrl
        });

        // Process each segment in this rodovia - limpar geojson para usar slice dinâmico
        for (const segmento of segments) {
          try {
            // Não salvar geojson no segmento - deixar o slice dinâmico funcionar
            await prisma.segmentoHomogeneo.update({
              where: { id: segmento.id },
              data: {
                geojson: undefined, // Limpar para usar slice dinâmico
                updatedAt: new Date()
              }
            });

            results.segmentos.push({
              id: segmento.uuid,
              nome: segmento.nome,
              rodovia: rodovia.nome,
              kmInicial: Number(segmento.kmInicial),
              kmFinal: Number(segmento.kmFinal),
              geojsonCleared: true
            });

          } catch (segError) {
            console.error(`Error processing segment ${segmento.nome}:`, segError);
          }
        }

      } catch (rodError) {
        console.error(`Error processing rodovia ${rodovia.nome}:`, rodError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'KMZ processing completed with SINFRA markers',
      results
    });

  } catch (error) {
    console.error('Error processing KMZ:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process KMZ' },
      { status: 500 }
    );
  }
}
