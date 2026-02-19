import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    [key: string]: any;
  };
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

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

    // Parse GeoJSON
    const text = await file.text();
    const geojson: GeoJSONFeatureCollection = JSON.parse(text);

    if (!geojson.type || geojson.type !== "FeatureCollection") {
      return NextResponse.json(
        { error: "Invalid GeoJSON: must be a FeatureCollection" },
        { status: 400 }
      );
    }


    // Agrupar features por Rodovia
    const groupedByRodovia = new Map<string, GeoJSONFeature[]>();
    
    for (const feature of geojson.features) {
      const props = feature.properties;
      
      // Identificar nome da rodovia de várias formas possíveis
      const nomeRodovia = props.Rodovia || 
                         props.NOME || 
                         props.rodovia ||
                         props.nome ||
                         props.SIGLA ||
                         "Rodovia Sem Nome";
      
      if (!groupedByRodovia.has(nomeRodovia)) {
        groupedByRodovia.set(nomeRodovia, []);
      }
      groupedByRodovia.get(nomeRodovia)!.push(feature);
    }


    const createdRodovias: any[] = [];
    const createdSegmentos: any[] = [];

    // Processar cada rodovia
    for (const [nomeRodovia, features] of groupedByRodovia.entries()) {
      // Pegar atributos da primeira feature como base
      const firstFeature = features[0].properties;
      
      // Verificar se rodovia já existe
      let rodovia = await prisma.rodovia.findFirst({
        where: { nome: nomeRodovia },
      });

      // Criar rodovia se não existir
      if (!rodovia) {
        rodovia = await prisma.rodovia.create({
          data: {
            uuid: randomUUID(),
            nome: nomeRodovia,
            codigo: firstFeature.SIGLA || firstFeature.codigo || null,
            concessionaria: firstFeature.concessionaria || null,
            metadata: {
              imported_from: file.name,
              total_features: features.length,
              // Store removed fields in metadata for reference
              sigla: firstFeature.SIGLA || null,
              uf: firstFeature.UF || null,
              regiao: firstFeature.REGIão || firstFeature.Regiao || null,
              mesorregiao: firstFeature.NOME_MESO || firstFeature.MESORREGIã || null,
            },
          },
        });
        
        createdRodovias.push(rodovia);
      } else {
      }

      // Criar segmentos a partir das features
      let segmentIndex = 0;
      for (const feature of features) {
        const props = feature.properties;
        
        // Debug: mostrar atributos da primeira feature
        if (segmentIndex === 0) {
        }
        
        // Verificar se tem KM definidos (tentar vários formatos)
        const kmInicial = props.Km_inicial || props.km_inicial || props.KM_INICIAL || 
                         props.KmInicial || props.kmInicial;
        const kmFinal = props.Km_Final || props.km_final || props.Km_final || 
                       props.KM_FINAL || props.KmFinal || props.kmFinal;

        // Se não tem KM, tentar extrair do nome ou criar sequencial
        let kmIni = kmInicial;
        let kmFim = kmFinal;
        
        if (!kmIni || !kmFim) {
          // Tentar extrair do nome (ex: "868+600" significa KM 868.6)
          const name = props.name || props.Name || props.NOME || props.nome;
          if (name && typeof name === 'string') {
            const kmMatch = name.match(/(\d+)\+?(\d+)?/);
            if (kmMatch) {
              kmIni = parseFloat(kmMatch[1] + '.' + (kmMatch[2] || '0'));
              kmFim = kmIni + 0.001; // Incremento mínimo
            }
          }
        }

        // Se ainda não tem KM, criar incremental
        if (!kmIni || !kmFim) {
          kmIni = segmentIndex;
          kmFim = segmentIndex + 1;
        }

        // Verificar se segmento já existe
        const existingSegmento = await prisma.segmento.findFirst({
          where: {
            rodovia_id: rodovia.id,
            kmInicial: parseFloat(String(kmIni)),
            kmFinal: parseFloat(String(kmFim)),
          },
        });

        if (existingSegmento) {
          segmentIndex++;
          continue;
        }

        // Criar segmento
        const segmento = await prisma.segmento.create({
          data: {
            uuid: randomUUID(),
            rodovia_id: rodovia.id,
            kmInicial: parseFloat(String(kmIni)),
            kmFinal: parseFloat(String(kmFim)),
            descricao: props.description || props.descricao || props.name || `Segmento ${segmentIndex}`,
            municipio: props.Municipio || props.NOME_MUNIC || props.municipio || null,
            bairro: props.Bairro || props.bairro || null,
            geocodigo: props.CD_GEOCODI || props.GEOCODIG_M || props.geocodigo || null,
            geojson: feature.geometry, // GEOMETRIA COMPLETA preservada!
            metadata: {
              feature_index: segmentIndex,
              nome_rio: props.Nome_Rio || null,
              hidro: props.HIDRO || null,
              sensibilidade: props.Sensibilid || null,
              captacao: props.Captaçao || null,
              fonte: props.Fonte || null,
              // Preservar todos os outros atributos
              ...Object.keys(props)
                .filter(k => !['Rodovia', 'Km_inicial', 'Km_Final', 'Municipio', 'Bairro', 'CD_GEOCODI'].includes(k))
                .reduce((obj, k) => ({ ...obj, [k]: props[k] }), {}),
            },
          },
        });

        createdSegmentos.push(segmento);
        segmentIndex++;
      }
    }


    return NextResponse.json({
      success: true,
      summary: {
        rodovias: createdRodovias.length,
        segmentos: createdSegmentos.length,
        totalFeatures: geojson.features.length,
      },
      rodovias: createdRodovias,
    });

  } catch (error) {
    console.error("Error processing GeoJSON:", error);
    return NextResponse.json(
      { error: "Error processing file: " + (error as Error).message },
      { status: 500 }
    );
  }
}
