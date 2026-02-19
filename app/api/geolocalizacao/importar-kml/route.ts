import { NextRequest, NextResponse } from "next/server";
import { DOMParser } from "xmldom";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

interface ImportStats {
  total: number;
  inserted: number;
  failed: number;
  rodoviaNome?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rodoviaId = formData.get("rodoviaId") as string;

    if (!file || !rodoviaId) {
      return NextResponse.json({ error: "Arquivo ou Rodovia ausente" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(arrayBuffer);
    
    // Parse KML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    const stats: ImportStats = { total: 0, inserted: 0, failed: 0 };
    const batchData: any[] = [];

    // Busca a rodovia para referência
    const rodovia = await prisma.rodovia.findUnique({
        where: { uuid: rodoviaId }
    });

    if (!rodovia) {
         return NextResponse.json({ error: "Rodovia não encontrada com este ID" }, { status: 404 });
    }

    stats.rodoviaNome = rodovia.nome;

    // 0. Limpar marcos existentes desta rodovia
    await prisma.marcoQuilometrico.deleteMany({
        where: { rodovia_id: rodovia.id }
    });

    // Função Recursiva para processar Pastas e Placemarks
    let debugLog = "";
    
    function log(msg: string) {
        debugLog += msg + "\n";
    }

    function processNode(node: Element, segmentName: string) {
        // Se for Folder ou Document, atualiza o nome do segmento e processa filhos
        if (node.nodeName === "Folder" || node.nodeName === "Document") {
            let newSegmentName = segmentName;
            
            // Tenta pegar o nome da pasta
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i] as Element;
                if (child.nodeName === "name") {
                    const folderName = child.textContent?.trim() || "";
                    if (folderName) {
                        // Ignorar pastas técnicas de CAD/Civil3D
                        if (/block reference|model/i.test(folderName)) {
                            log(`[FOLDER IGNORED] Name: "${folderName}" (Parent kept: "${segmentName}")`);
                            // Mantém o segmentName do pai (ex: "EIXO SNV BR163")
                            newSegmentName = segmentName;
                        } else {
                            newSegmentName = folderName;
                            log(`[FOLDER FOUND] Name: "${folderName}" (Parent: "${segmentName}")`);
                        }
                    }
                    break;
                }
            }
            
            // Processa filhos recursivamente
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i] as Element;
                if (child.nodeType === 1) { // Element Node
                    processNode(child, newSegmentName);
                }
            }
        } 
        // Se for kml (raiz), processa filhos
        else if (node.nodeName === "kml") {
             for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i] as Element;
                if (child.nodeType === 1) {
                    processNode(child, segmentName);
                }
            }
        }
        // Se for Placemark, extrai dados
        else if (node.nodeName === "Placemark") {
            stats.total++;
            try {
                let name = "";
                let coordinates = "";
                let description = "";

                // Extrair Nome e Geometria e Descrição
                for (let i = 0; i < node.childNodes.length; i++) {
                    const child = node.childNodes[i] as Element;
                    if (child.nodeName === "name") {
                        name = child.textContent?.trim() || "";
                    } else if (child.nodeName === "description") {
                        description = child.textContent?.trim() || "";
                    } else if (child.nodeName === "Point") {
                         const coordsTag = child.getElementsByTagName("coordinates")[0];
                         if (coordsTag) coordinates = coordsTag.textContent?.trim() || "";
                    }
                }

                // Logar amostra dos primeiros pontos de cada segmento
                // ou se for suspeito
                const isSample = stats.total % 50 === 0 || stats.total < 10 || /FXAD/i.test(name);
                if (isSample) {
                   log(`[PLACEMARK SAMPLE] Name: "${name}" | Segment: "${segmentName}" | Desc: "${description?.substring(0, 100)}..." | Coords: ${coordinates ? "Yes" : "No"}`);
                }

                if (!name || !coordinates) {
                   if (isSample) log(`   -> SKIPPED (Missing name or coords)`);
                   stats.failed++;
                   return;
                }

                // Helper para extrair KM de texto com segurança
                const extractKmSafe = (text: string): number => {
                    if (!text) return -1;
                    
                    // 1. Remover padrões de Rodovia para evitar falso positivo (ex: "BR 163" -> não é km 163)
                    // Remove "BR 163", "BR-163", "VB 163", "MT-123", etc.
                    const cleanText = text.replace(/(?:BR|VB|SP|RJ|MG|RS|PR|SC|ES|BA|MT|MS|GO|DF|TO|SE|AL|PE|PB|RN|CE|PI|MA|AP|PA|RR|RO|AM|AC)\s*[-]?\s*\d+/gi, ' ');
                    
                    // 2. Tenta formato DNIT "100+200" (Prioridade Máxima)
                    const matchDnit = cleanText.match(/(\d+)\+(\d+)/);
                    if (matchDnit) {
                        const km = parseFloat(matchDnit[1]);
                        const metros = parseFloat(matchDnit[2]);
                        if (!isNaN(km) && !isNaN(metros)) {
                             return km + (metros / 1000);
                        }
                    }

                    // 3. Tenta formato explícito "KM 100", "KM: 100.5", "K 100"
                    // Regex: (km|k) [espaço ou : opcional] [numero com . ou ,]
                    const matchExplicit = cleanText.match(/(?:km|k|kilometros|kilometro)\s*[:]?\s*(\d+(?:[.,]\d+)?)/i);
                    if (matchExplicit) {
                         const val = parseFloat(matchExplicit[1].replace(',', '.'));
                         if (!isNaN(val)) return val;
                    }

                    // 4. Última tentativa: Número isolado (mas arriscado, então só se não tivermos nada melhor)
                    // Evita pegar anos (2024), larguras (3.5m) de forma cega.
                    // Idealmente, para KMs isolados como "80", o formato é inicio da string ou isolado.
                    // Regex: Inicio da string ou após espaço, digitos+opcional decimal, fim ou espaço.
                    const matchIsolated = cleanText.match(/(?:^|\s)(\d+(?:[.,]\d+)?)(?:$|\s)/);
                    if (matchIsolated) {
                        const val = parseFloat(matchIsolated[1].replace(',', '.'));
                        // Filtro básico de sanidade: KM > 2000 ou < 0 provavelmente é erro (ano ou lixo), exceto se rodovia for transbrasiliana gigante.
                        // Mas BR vai até 4000+. Vamos aceitar, o filtro de BR lá em cima já ajuda.
                         if (!isNaN(val)) return val;
                    }
                    
                    return -1;
                };

                // Processar Nome
                // Remover espaços extras
                const cleanName = name.trim();
                let kmValue = extractKmSafe(cleanName);

                // FALLBACK: Tentar extrair KM da DESCRIÇÃO
                if (kmValue < 0 && description) {
                     kmValue = extractKmSafe(description);
                     if (kmValue >= 0 && isSample) log(`   -> KM recovered from Description: ${kmValue}`);
                }

                // Lista de Itens que DEVEM ser importados mesmo se o KM falhar (serão plotados apenas por Lat/Lng)
                // (Mantém apenas a lista visual, pois a lógica de extração mudou)
                const CRITICAL_KEYWORDS = ['ppd', 'pedagio', 'praca', 'camera', 'radar', 'acesso', 'retorno', 'entroncamento', 'trevo', 'fxad', 'faixa', 'ponte', 'viaduto', 'oae', 'tunel'];
                const isCritical = CRITICAL_KEYWORDS.some(k => 
                    name.toLowerCase().includes(k) || 
                    segmentName.toLowerCase().includes(k) ||
                    description.toLowerCase().includes(k)
                );

                // FALLBACK 2: Tentar extrair KM do NOME DA PASTA (SegmentName)
                if (kmValue < 0 && segmentName) {
                    kmValue = extractKmSafe(segmentName);
                    if (kmValue >= 0 && (isSample || isCritical)) log(`   -> KM recovered from Folder Name ("${segmentName}"): ${kmValue}`);
                }

                if (isSample) log(`   -> Parsed KM: ${kmValue}`);

                // Se não conseguiu parsear KM válido
                if (kmValue < 0) {
                    if (isCritical) {
                        // SALVAR DE QUALQUER JEITO!
                        // Usa KM 0 como placeholder.
                        kmValue = 0;
                        if (isSample) log(`   -> [FORCED IMPORT] Critical Item without KM (Saved as 0).`);
                    } else {
                         if (isSample) log(`   -> SKIPPED (Invalid KM and not Critical)`);
                         return;
                    }
                }

                const coords = coordinates.split(",");
                const lng = parseFloat(coords[0]);
                const lat = parseFloat(coords[1]);

                if (isNaN(lat) || isNaN(lng)) {
                    stats.failed++;
                    return;
                }

                batchData.push({
                    uuid: uuidv4(),
                    rodovia_id: rodovia!.id,
                    nome: name,
                    km: kmValue,
                    latitude: lat,
                    longitude: lng,
                    segmento_origem: segmentName || "Principal", 
                    geoJson: { description: description } // Salvar descricao extra no JSON
                });

            } catch (e) {
                log(`[ERROR] Parsing placemark: ${e}`);
                stats.failed++;
            }
        }
    }

    // Iniciar processamento a partir do Elemento Raiz do XML
    if (xmlDoc.documentElement) {
        processNode(xmlDoc.documentElement, "Desconhecido");
    }

    // Escrever Log
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(process.cwd(), 'kml_debug.log');
        fs.writeFileSync(logPath, debugLog);
    } catch (err) {
        console.error("Erro escrevendo log:", err);
    }

    // Inserir em Batch
    if (batchData.length > 0) {
        // createMany é mais eficiente
        await prisma.marcoQuilometrico.createMany({
            data: batchData as any,
            skipDuplicates: true
        });
        stats.inserted = batchData.length;
    }

    return NextResponse.json({ 
        message: "Importação concluída", 
        stats 
    });

  } catch (error: any) {
    console.error("Erro importando KML:", error);
    return NextResponse.json({ error: error.message || "Falha na importação" }, { status: 500 });
  }
}
