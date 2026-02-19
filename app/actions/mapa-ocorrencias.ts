"use server";

import { Prisma } from "@prisma/client";
import prisma, { safeQueryRaw } from "@/lib/prisma";
import { along, length as turfLength, lineString, lineSliceAlong, point, nearestPointOnLine, distance as turfDistance } from "@turf/turf";
import { unstable_cache } from "next/cache";


interface OccurrenceFilters {
    segmentoId?: number | null;
    grupoId?: number | null;
    indicadorId?: number | null;
    projectSlug?: string | null;
}

// Helper: converte BigInt → Number para serialização JSON (unstable_cache)
function serializeBigInt<T>(data: T): T {
    return JSON.parse(JSON.stringify(data, (_key, value) =>
        typeof value === 'bigint' ? Number(value) : value
    ));
}


export async function getFilterOptions() {
    try {
        const [segmentos, grupos, indicadores] = await Promise.all([
            prisma.segmentoHomogeneo.findMany({
                select: { id: true, nome: true },
                orderBy: { nome: 'asc' }
            }),
            prisma.grupo.findMany({
                select: { id: true, nome: true },
                orderBy: { nome: 'asc' }
            }),
            prisma.indicador.findMany({
                select: { id: true, nome: true },
                orderBy: { nome: 'asc' }
            })
        ]);

        return {
            segmentos: segmentos.map(s => ({ id: Number(s.id), nome: s.nome })),
            grupos: grupos.map(g => ({ id: Number(g.id), nome: g.nome })),
            indicadores: indicadores.map(i => ({ id: Number(i.id), nome: i.nome }))
        };
    } catch (error) {
        console.error("Erro ao buscar filtros:", error);
        return { segmentos: [], grupos: [], indicadores: [] };
    }
}

// Buscar traçado completo de todas as rodovias para o mapa (com cache)
export async function getHighwayTraces(projectSlug?: string) {
    const slug = projectSlug || '__all__';
    return getCachedHighwayTraces(slug);
}

const getCachedHighwayTraces = unstable_cache(
  async (slug: string) => {
    return _getHighwayTracesImpl(slug === '__all__' ? undefined : slug);
  },
  ['highway-traces'],
  { revalidate: 300, tags: ['highway-traces'] }
);

async function _getHighwayTracesImpl(projectSlug?: string) {
    const { extractMainLineString } = await import('@/lib/kmz-processor');
    
    try {

        let whereFilter: any = {};
        
        if (projectSlug) {
            const project = await prisma.projects.findFirst({
                where: { slug: projectSlug },
                select: { id: true }
            });
            if (project) {
                whereFilter.project_id = project.id;
            }
        }

        const rodovias = await prisma.rodovia.findMany({
            where: whereFilter,
            select: {
                id: true,
                nome: true,
                geojson: true,
                extensao: true
            }
        });

        const features: any[] = [];

        for (const r of rodovias) {
            if (r.geojson && typeof r.geojson === 'object') {
                const gj = r.geojson as any;
                

                
                const mainLine = extractMainLineString(gj);
                
                if (mainLine && mainLine.geometry) {
                    features.push({
                        ...mainLine,
                        properties: {
                            ...mainLine.properties,
                            rodovia: r.nome,
                            rodovia_id: r.id.toString(),
                            extensao: r.extensao ? parseFloat(r.extensao.toString()) : null,
                            isReference: true
                        }
                    });

                }
            }
        }


        return {
            type: "FeatureCollection",
            features
        };
    } catch (error) {
        console.error("Erro ao buscar traçado:", error);
        return { type: "FeatureCollection", features: [] };
    }
}

// Busca ocorrências com coordenadas calculadas via interpolação Turf.js
export async function getOccurrencesGeoJSON(filters: OccurrenceFilters = {}) {
    const cacheKey = `occ-geo-${filters.projectSlug || 'all'}-${filters.segmentoId || 0}-${filters.grupoId || 0}-${filters.indicadorId || 0}`;
    
    const cached = getCachedOccurrencesGeoJSON(cacheKey, filters);
    return cached;
}

const getCachedOccurrencesGeoJSON = unstable_cache(
    async (_cacheKey: string, filters: OccurrenceFilters) => {
        return _getOccurrencesGeoJSONImpl(filters);
    },
    ['occurrences-geojson'],
    { revalidate: 60, tags: ['occurrences-geojson'] }
);

async function _getOccurrencesGeoJSONImpl(filters: OccurrenceFilters = {}) {
    const { extractMainLineString } = await import('@/lib/kmz-processor');
    
    try {

        // Filtros parametrizados para evitar SQL injection
        const { segmentoId, grupoId, indicadorId, projectSlug } = filters;
        
        const conditions: Prisma.Sql[] = [];
        
        // FILTRO POR PROJETO — restringe ocorrências ao projeto ativo
        if (projectSlug) {
            conditions.push(Prisma.sql`p.slug = ${projectSlug}`);
        }
        
        if (segmentoId) {
            conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM ocorrencias_trechos ot WHERE ot.ocorrencia_id = o.id AND ot.segmentoHomogeneo_id = ${segmentoId})`);
        }
        if (grupoId) {
            conditions.push(Prisma.sql`ind.grupo_id = ${grupoId}`);
        }
        if (indicadorId) {
            conditions.push(Prisma.sql`o.indicador_id = ${indicadorId}`);
        }
        
        const whereClause = conditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
            : Prisma.empty;

        // Pré-carregar geojsons das rodovias UMA VEZ (em vez de trazer r.geojson por linha)
        const rodoviaGeojsons = await safeQueryRaw<any[]>(Prisma.sql`
            SELECT r.id, r.geojson, r.extensao
            FROM rodovias r
            ${projectSlug ? Prisma.sql`JOIN projects p ON r.project_id = p.id WHERE p.slug = ${projectSlug}` : Prisma.empty}
        `);
        
        const rodoviaGeojsonMap = new Map<string, any>();
        for (const rg of serializeBigInt(rodoviaGeojsons)) {
            rodoviaGeojsonMap.set(rg.id.toString(), {
                geojson: rg.geojson,
                extensao: rg.extensao
            });
        }

        const rawOcorrencias = await safeQueryRaw<any[]>(Prisma.sql`
            SELECT 
                o.id,
                o.uuid,
                o.anotacoes,
                o.status,
                i.rodovia_id,
                r.nome as rodovia_nome,
                r.uuid as rodovia_uuid,
                r.extensao as rodovia_extensao,
                (SELECT ot.kmInicial FROM ocorrencias_trechos ot WHERE ot.ocorrencia_id = o.id LIMIT 1) as km_inicial,
                (SELECT ot.kmFinal FROM ocorrencias_trechos ot WHERE ot.ocorrencia_id = o.id LIMIT 1) as km_final,
                (SELECT sh.kmInicial FROM ocorrencias_trechos ot 
                    JOIN segmentos_homogeneos sh ON ot.segmentoHomogeneo_id = sh.id 
                    WHERE ot.ocorrencia_id = o.id LIMIT 1) as segmento_km_inicial,
                (SELECT sh.kmFinal FROM ocorrencias_trechos ot 
                    JOIN segmentos_homogeneos sh ON ot.segmentoHomogeneo_id = sh.id 
                    WHERE ot.ocorrencia_id = o.id LIMIT 1) as segmento_km_final,
                (SELECT sh.kmInicialKML FROM ocorrencias_trechos ot 
                    JOIN segmentos_homogeneos sh ON ot.segmentoHomogeneo_id = sh.id 
                    WHERE ot.ocorrencia_id = o.id LIMIT 1) as segmento_km_inicial_kml,
                (SELECT sh.id FROM ocorrencias_trechos ot 
                    JOIN segmentos_homogeneos sh ON ot.segmentoHomogeneo_id = sh.id 
                    WHERE ot.ocorrencia_id = o.id LIMIT 1) as segmento_id,
                (SELECT of2.latitude FROM ocorrencias_fotos of2 WHERE of2.ocorrencia_id = o.id ORDER BY of2.ordem ASC LIMIT 1) as foto_lat,
                (SELECT of2.longitude FROM ocorrencias_fotos of2 WHERE of2.ocorrencia_id = o.id ORDER BY of2.ordem ASC LIMIT 1) as foto_lng,
                ind.nome as indicador_nome
            FROM ocorrencias o
            LEFT JOIN inspecoes i ON o.inspecao_id = i.id
            LEFT JOIN rodovias r ON i.rodovia_id = r.id
            LEFT JOIN indicadores ind ON o.indicador_id = ind.id
            ${projectSlug ? Prisma.sql`LEFT JOIN projects p ON r.project_id = p.id` : Prisma.empty}
            ${whereClause}
            LIMIT 5000
        `);

        // Serializar BigInt → Number para compatibilidade com JSON / unstable_cache
        const ocorrencias = serializeBigInt(rawOcorrencias);



        // Cache de LineStrings por rodovia
        const rodoviaLineCache: Map<string, { line: any; length: number } | null> = new Map();

        // Função interna para preparar LineString de uma rodovia
        const prepareRodoviaLine = (geojson: any): { line: any; length: number } | null => {
            try {
                const mainLine = extractMainLineString(geojson);
                if (!mainLine || !mainLine.geometry) return null;

                // Se for MultiLineString, converter para LineString único concatenando coordenadas
                let lineForAlong = mainLine;
                if (mainLine.geometry.type === 'MultiLineString') {
                    // Flatten todas as line segments em uma única LineString
                    const allCoords: number[][] = [];
                    for (const lineCoords of mainLine.geometry.coordinates) {
                        // Evitar duplicar pontos de conexão
                        if (allCoords.length > 0) {
                            const lastPoint = allCoords[allCoords.length - 1];
                            const firstPoint = lineCoords[0];
                            // Se último ponto é igual ao primeiro do próximo, não adicionar duplicata
                            if (lastPoint[0] === firstPoint[0] && lastPoint[1] === firstPoint[1]) {
                                allCoords.push(...lineCoords.slice(1));
                            } else {
                                allCoords.push(...lineCoords);
                            }
                        } else {
                            allCoords.push(...lineCoords);
                        }
                    }
                    
                    lineForAlong = lineString(allCoords, mainLine.properties || {});
                }

                const length = turfLength(lineForAlong, { units: 'kilometers' });
                return { line: lineForAlong, length };
            } catch (e) {
                console.error("Erro ao preparar linha da rodovia:", e);
                return null;
            }
        };

        // Função interna para calcular coordenadas ao longo da linha baseado em KM
        const getPointAlongLine = (km: number, lineData: { line: any; length: number }): { lat: number; lng: number } | null => {
            try {
                // km é a distância em km desde o início da rodovia
                // Precisamos converter para distância ao longo da geometria
                let distance = km;
                
                // Garantir que distance está dentro dos limites
                if (distance < 0) distance = 0;
                if (distance > lineData.length) distance = lineData.length;

                const p = along(lineData.line, distance, { units: 'kilometers' });
                
                if (p && p.geometry && p.geometry.coordinates) {
                    return {
                        lng: p.geometry.coordinates[0],
                        lat: p.geometry.coordinates[1]
                    };
                }
                return null;
            } catch (e) {
                console.error("Erro ao calcular ponto na linha:", e);
                return null;
            }
        };

        const features = [];
        let fromLine = 0;
        let fromPhoto = 0;
        let skipped = 0;
        let noRodovia = 0;
        let noKm = 0;

        for (const o of ocorrencias) {
            let lat: number | null = null;
            let lng: number | null = null;
            let source = 'unknown';

            const rodoviaKey = o.rodovia_id?.toString() || 'unknown';

            // Verificar se temos dados da rodovia via lookup no mapa
            const rodoviaGeoData = rodoviaGeojsonMap.get(rodoviaKey);
            if (!rodoviaGeoData || !rodoviaGeoData.geojson) {
                noRodovia++;
                skipped++;
                continue;
            }
            
            if (!rodoviaLineCache.has(rodoviaKey)) {
                try {
                    const geojson = typeof rodoviaGeoData.geojson === 'string' 
                        ? JSON.parse(rodoviaGeoData.geojson) 
                        : rodoviaGeoData.geojson;
                    const ld = prepareRodoviaLine(geojson);
                    rodoviaLineCache.set(rodoviaKey, ld);
                } catch (e) {
                    console.error(`Erro ao processar geojson da rodovia ${rodoviaKey}:`, e);
                    rodoviaLineCache.set(rodoviaKey, null);
                }
            }

            const lineData = rodoviaLineCache.get(rodoviaKey);

            // PRIORIDADE 1: Interpolar ao longo da linha usando KM + offset do segmento
            if (o.km_inicial && lineData) {
                const occKmIni = parseFloat(o.km_inicial.toString());
                const segmentOffset = parseFloat(o.segmento_km_inicial_kml?.toString() || o.segmento_km_inicial?.toString() || '0');
                
                // Posição absoluta inicial
                const absoluteKmStart = segmentOffset + occKmIni;
                
                // Verificar se é um TRECHO (tem km_final > km_inicial)
                let isRange = false;
                let absoluteKmEnd = absoluteKmStart;
                
                if (o.km_final) {
                    const occKmFim = parseFloat(o.km_final.toString());
                    // Se a diferença for significativa (> 0.1km), tratar como trecho
                    if (occKmFim > occKmIni + 0.05) {
                        isRange = true;
                        absoluteKmEnd = segmentOffset + occKmFim;
                    }
                }

                if (!isNaN(absoluteKmStart)) {
                    // SE FOR TRECHO: Gerar LineString
                    if (isRange && absoluteKmEnd > absoluteKmStart) {
                         try {
                             // Garantir que não passe do fim da linha
                             const start = Math.max(0, Math.min(absoluteKmStart, lineData.length));
                             const end = Math.max(0, Math.min(absoluteKmEnd, lineData.length));
                             
                             if (end > start) {
                                 const sliced = lineSliceAlong(lineData.line, start, end, { units: 'kilometers' });
                                 
                                 if (sliced && sliced.geometry) {
                                     features.push({
                                         type: "Feature",
                                         geometry: sliced.geometry,
                                         properties: {
                                             id: o.id.toString(),
                                             uuid: o.uuid,
                                             descricao: o.anotacoes || o.indicador_nome || "Ocorrência (Trecho)",
                                             status: o.status,
                                             km: `${o.km_inicial} - ${o.km_final}`,
                                             rodovia: o.rodovia_nome,
                                             source: 'line_slice',
                                             type: 'occurrence', // Importante para o estilo identificar
                                             segmento_id: o.segmento_id // Passar ID para colorir
                                         }
                                     });
                                     fromLine++;
                                     continue; // Já processou esta ocorrência
                                 }
                             }
                         } catch (e) {
                             console.error(`Erro ao fatiar linha para ocorrência ${o.id}:`, e);
                         }
                    }

                    // SE FOR PONTO (ou falha no slice): Gerar Point
                    const coords = getPointAlongLine(absoluteKmStart, lineData);
                    if (coords) {
                        lat = coords.lat;
                        lng = coords.lng;
                        source = 'line_interpolation';
                        fromLine++;
                    }
                }
            } else if (!o.km_inicial) {
                noKm++;
            }

            // PRIORIDADE 2: Usar coordenadas da foto como fallback
            if (lat === null && o.foto_lat && o.foto_lng && lineData) {
                const photoLat = parseFloat(o.foto_lat.toString());
                const photoLng = parseFloat(o.foto_lng.toString());
                
                if (!isNaN(photoLat) && !isNaN(photoLng) && photoLat !== 0 && photoLng !== 0) {
                    // Verifica se está perto da linha (usando distância do ponto à linha)
                    try {
                        const photoPoint = point([photoLng, photoLat]);
                        const nearest = nearestPointOnLine(lineData.line, photoPoint);
                        const dist = turfDistance(photoPoint, nearest, { units: 'kilometers' });
                        
                        if (dist < 5) {
                            lat = photoLat;
                            lng = photoLng;
                            source = 'photo';
                            fromPhoto++;

                        }
                    } catch {
                        // Fallback - aceitar foto se não conseguir calcular distância
                        lat = photoLat;
                        lng = photoLng;
                        source = 'photo';
                        fromPhoto++;
                    }
                }
            }

            if (lat === null || lng === null) {
                skipped++;
                continue;
            }

            features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [lng, lat] // GeoJSON is [lng, lat]
                },
                properties: {
                    id: o.id.toString(),
                    uuid: o.uuid,
                    descricao: o.anotacoes || o.indicador_nome || "Sem descrição",
                    status: o.status,
                    km: o.km_inicial ? o.km_inicial.toString() : null,
                    rodovia: o.rodovia_nome || "Desconhecida",
                    source: source,
                    type: 'occurrence',
                    segmento_id: o.segmento_id
                }
            });
        }


        return {
            type: "FeatureCollection",
            features
        };

    } catch (error) {
        console.error("Erro ao buscar dados do mapa:", error);
        return { type: "FeatureCollection", features: [] };
    }
}
