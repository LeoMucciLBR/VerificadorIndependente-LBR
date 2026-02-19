import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface OcorrenciaGeo {
  id: string;
  uuid: string;
  kmInicial: number;
  kmFinal: number | null;
  lat: number;
  lng: number;
  indicador: string | null;
  status: string;
  lado: string;
  dataHoraOcorrencia: string;
  anotacoes: string | null;
  segmentoNome: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rodoviaId = searchParams.get("rodoviaId");

    if (!rodoviaId) {
      return NextResponse.json(
        { error: "rodoviaId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar rodovia com GeoJSON
    const rodovia = await prisma.rodovia.findUnique({
      where: { uuid: rodoviaId },
      select: { id: true, codigo: true, geojson: true }
    });

    if (!rodovia) {
      return NextResponse.json(
        { error: "Rodovia não encontrada" },
        { status: 404 }
      );
    }

    // Buscar segmentos desta rodovia
    const segmentos = await prisma.segmentoHomogeneo.findMany({
      where: { rodovia_id: rodovia.id },
      select: { id: true, descricao: true, kmInicial: true, kmFinal: true }
    });

    if (segmentos.length === 0) {
      return NextResponse.json({ ocorrencias: [] }, { status: 200 });
    }

    const segmentoIds = segmentos.map(s => s.id);

    // Buscar ocorrências que têm trechos nesses segmentos
    const ocorrenciasTrechos = await prisma.ocorrenciaTrecho.findMany({
      where: {
        segmentoHomogeneo_id: { in: segmentoIds }
      },
      include: {
        ocorrencias: {
          include: {
            indicadores: { select: { nome: true } }
          }
        },
        segmentos_homogeneos: { select: { descricao: true } }
      }
    });

    // Extrair marcadores do GeoJSON para converter KM para coordenadas
    const geojson = rodovia.geojson as any;
    const markers: { km: number; lng: number; lat: number }[] = [];

    if (geojson?.features) {
      geojson.features.forEach((f: any) => {
        if (f.geometry?.type === 'Point' && f.properties?.name) {
          const name = f.properties.name;
          const kmMatch = name.match(/KM\s*(\d+)/i) || name.match(/(\d+)/);
          if (kmMatch) {
            markers.push({
              km: parseFloat(kmMatch[1]),
              lng: f.geometry.coordinates[0],
              lat: f.geometry.coordinates[1]
            });
          }
        }
      });
    }

    // Ordenar marcadores por KM
    markers.sort((a, b) => a.km - b.km);

    // Função para interpolar coordenadas baseado no KM
    const kmToCoords = (km: number): { lat: number; lng: number } | null => {
      if (markers.length === 0) return null;

      // Encontrar marcadores mais próximos
      let before = markers[0];
      let after = markers[markers.length - 1];

      for (let i = 0; i < markers.length; i++) {
        if (markers[i].km <= km) {
          before = markers[i];
        }
        if (markers[i].km >= km && (after.km < km || markers[i].km < after.km)) {
          after = markers[i];
          break;
        }
      }

      // Se KM exato existe
      const exact = markers.find(m => m.km === km);
      if (exact) return { lat: exact.lat, lng: exact.lng };

      // Interpolar entre os dois marcadores
      if (before.km === after.km) {
        return { lat: before.lat, lng: before.lng };
      }

      const ratio = (km - before.km) / (after.km - before.km);
      return {
        lat: before.lat + (after.lat - before.lat) * ratio,
        lng: before.lng + (after.lng - before.lng) * ratio
      };
    };

    // Converter ocorrências para formato geo
    const ocorrenciasGeo: OcorrenciaGeo[] = [];

    for (const trecho of ocorrenciasTrechos) {
      const km = parseFloat(trecho.kmInicial.toString());
      const coords = kmToCoords(km);

      if (coords) {
        const oc = trecho.ocorrencias;
        ocorrenciasGeo.push({
          id: oc.id.toString(),
          uuid: oc.uuid,
          kmInicial: km,
          kmFinal: trecho.kmFinal ? parseFloat(trecho.kmFinal.toString()) : null,
          lat: coords.lat,
          lng: coords.lng,
          indicador: oc.indicadores?.nome || null,
          status: oc.status,
          lado: oc.lado,
          dataHoraOcorrencia: oc.dataHoraOcorrencia.toISOString(),
          anotacoes: oc.anotacoes,
          segmentoNome: trecho.segmentos_homogeneos?.descricao || null
        });
      }
    }


    return NextResponse.json(
      { ocorrencias: ocorrenciasGeo },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching ocorrências:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ocorrências" },
      { status: 500 }
    );
  }
}
