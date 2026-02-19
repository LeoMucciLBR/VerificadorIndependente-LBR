"use server";

import { Prisma } from "@prisma/client";
import prisma, { safeQueryRaw } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { serialize } from "@/lib/serialize";

const OcorrenciaSchema = z.object({
  inspecao_id: z.string().min(1, "Selecione uma inspeção"),
  indicador_id: z.string().optional(),
  grupo_id: z.string().optional(),
  data_hora: z.string().min(1, "Data e hora são obrigatórias"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  lado: z.enum(["Esquerdo", "direito", "ambos"]).optional(),
  pista: z.enum(["FT01", "FT01_FT02", "FT02", "FD", "AC", "CC"]).optional(),
  segmento_id: z.string().optional(),
  km_inicial: z.string().optional(),
  km_final: z.string().optional(),
  valor_medido: z.string().optional(),
  unidade_medida: z.string().optional(),
  dentro_do_limite: z.enum(["sim", "nao", ""]).optional(),
});

export async function getOcorrencias(page = 1, limit = 50, projectSlug?: string) {
  try {
    const skip = (page - 1) * limit;
    
    // Build rodovia filter based on project - SECURITY: Use parameterized query
    let rodoviaIds: bigint[] = [];
    if (projectSlug) {
      // Get project's rodovias
      const project = await prisma.projects.findFirst({
        where: { 
          OR: [
            { slug: projectSlug },
            { codigo: projectSlug }
          ]
        },
        include: {
          project_rodovias: {
            select: { rodovia_id: true }
          }
        }
      });
      
      if (project && project.project_rodovias.length > 0) {
        rodoviaIds = project.project_rodovias.map(pr => pr.rodovia_id);
      } else {
        // No rodovias for this project, return empty
        return { success: true, data: [], pagination: { total: 0, pages: 1, current: page } };
      }
    }
    
    // Raw query para tratar datas inválidas (0000-00-00) via NULLIF
    const rodoviaFilter = rodoviaIds.length > 0 
      ? Prisma.sql`WHERE i.rodovia_id IN (${Prisma.join(rodoviaIds)})`
      : Prisma.empty;
    
    const rawOcorrencias = await safeQueryRaw<any[]>(Prisma.sql`
      SELECT 
        o.id,
        o.uuid,
        o.inspecao_id,
        o.indicador_id,
        o.grupo_id,
        NULLIF(o.dataHoraOcorrencia, '0000-00-00 00:00:00') as dataHoraOcorrencia,
        o.anotacoes,
        o.registroReferenteA,
        o.status,
        o.lado,
        o.pistaFaixa,
        o.valor_medido,
        o.unidade_medida,
        o.dentro_do_limite,
        NULLIF(o.createdAt, '0000-00-00 00:00:00') as createdAt,
        NULLIF(o.updatedAt, '0000-00-00 00:00:00') as updatedAt,
        i.id as inspecao_id_rel,
        i.uuid as inspecao_uuid,
        NULLIF(i.periodoReferencia, '0000-00-00') as inspecao_periodo,
        i.status as inspecao_status,
        i.usuario_id as inspecao_usuario_id,
        NULLIF(i.dataInicioVistoria, '0000-00-00 00:00:00') as dataInicioVistoria,
        NULLIF(i.dataFimVistoria, '0000-00-00 00:00:00') as dataFimVistoria,
        u.name as usuario_nome,
        r.id as rodovia_id,
        r.uuid as rodovia_uuid,
        r.nome as rodovia_nome,
        ind.nome as indicador_nome,
        ind.sigla as indicador_sigla,
        g.nome as grupo_nome,
        g.sigla as grupo_sigla,
        f.nome as fase_nome,
        (SELECT caminhoArquivo FROM ocorrencias_fotos WHERE ocorrencia_id = o.id LIMIT 1) as foto_path
      FROM ocorrencias o
      LEFT JOIN inspecoes i ON o.inspecao_id = i.id
      LEFT JOIN fases f ON i.fase_id = f.id
      LEFT JOIN users u ON i.usuario_id = u.id
      LEFT JOIN rodovias r ON i.rodovia_id = r.id
      LEFT JOIN indicadores ind ON o.indicador_id = ind.id
      LEFT JOIN grupos g ON o.grupo_id = g.id
      ${rodoviaFilter}
      ORDER BY NULLIF(o.dataHoraOcorrencia, '0000-00-00 00:00:00') IS NULL, NULLIF(o.dataHoraOcorrencia, '0000-00-00 00:00:00') DESC
      LIMIT ${limit} OFFSET ${skip}
    `);

    const ocorrenciaIds = rawOcorrencias.map(o => BigInt(o.id));
    let trechosMap = new Map<string, any[]>();
    let fotosMap = new Map<string, any[]>();
    
    if (ocorrenciaIds.length > 0) {
      try {
        // Fetch Trechos
        const trechos = await prisma.ocorrenciaTrecho.findMany({
          where: { ocorrencia_id: { in: ocorrenciaIds } },
          include: {
            segmentos_homogeneos: {
              select: { 
                nome: true,
                geojson: true,
                kmInicial: true,
                kmFinal: true,
                kmInicialKML: true,
                kmFinalKML: true,
                descricao: true
              }
            }
          }
        });
        


        trechos.forEach(t => {
          const key = t.ocorrencia_id.toString();
          if (!trechosMap.has(key)) trechosMap.set(key, []);
          trechosMap.get(key)!.push(t);
        });

        // Busca fotos em duas etapas para tratar datas inválidas no banco
        const safeFotos = await prisma.ocorrenciaFoto.findMany({
            where: { ocorrencia_id: { in: ocorrenciaIds } },
            select: {
                id: true,
                uuid: true,
                ocorrencia_id: true,
                caminhoArquivo: true,
                latitude: true,
                longitude: true,
                ordem: true
            },
            orderBy: { ordem: 'asc' }
        });



        let dateMap = new Map<string, string | null>();
        if (safeFotos.length > 0) {
            const fotoIds = safeFotos.map(f => f.id);
            try {
                 const rawDates = await safeQueryRaw<any[]>(Prisma.sql`
                    SELECT 
                        id,
                        NULLIF(dataHoraFoto, '0000-00-00 00:00:00') as dataHoraFoto
                    FROM ocorrencias_fotos
                    WHERE id IN (${Prisma.join(fotoIds)})
                 `);
                 rawDates.forEach(r => {
                     dateMap.set(r.id.toString(), r.dataHoraFoto);
                 });
            } catch (dateError) {
                console.warn("Erro ao buscar datas das fotos:", dateError);
            }
        }
        
        // Merge and map
        safeFotos.forEach(f => {
             const key = f.ocorrencia_id.toString();
             if (!fotosMap.has(key)) fotosMap.set(key, []);
             
             const dateVal = dateMap.get(f.id.toString());
             
             fotosMap.get(key)!.push({
                 ...f,
                 dataHoraFoto: dateVal || null // Attach the safe raw date
             });
        });

      } catch (e) {
        console.warn("Erro ao buscar detalhes (trechos/fotos):", e);
      }
    }

    const ocorrencias = rawOcorrencias.map(row => {
        return {
      id: row.id,
      uuid: row.uuid,
      inspecao_id: row.inspecao_id,
      indicador_id: row.indicador_id,
      dataHoraOcorrencia: row.dataHoraOcorrencia,
      anotacoes: row.anotacoes,
      registroReferenteA: row.registroReferenteA,
      status: row.status,
      lado: row.lado,
      pistaFaixa: row.pistaFaixa,
      valor_medido: row.valor_medido,
      unidade_medida: row.unidade_medida,
      dentro_do_limite: row.dentro_do_limite,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      users: row.usuario_nome ? {
        name: row.usuario_nome
      } : null,
      inspecoes: row.inspecao_id_rel ? {
        id: row.inspecao_id_rel,
        uuid: row.inspecao_uuid,
        periodoReferencia: row.inspecao_periodo,
        status: row.inspecao_status,
        dataInicioVistoria: row.dataInicioVistoria,
        dataFimVistoria: row.dataFimVistoria,
        fase: row.fase_nome ? { nome: row.fase_nome } : null,
        rodovias: row.rodovia_nome ? { 
          id: row.rodovia_id?.toString(),
          uuid: row.rodovia_uuid,
          nome: row.rodovia_nome 
        } : null
      } : null,
      indicadores: row.indicador_nome ? {
        nome: row.indicador_nome,
        sigla: row.indicador_sigla
      } : null,
      grupos: row.grupo_nome ? {
        nome: row.grupo_nome,
        sigla: row.grupo_sigla
      } : null,
      ocorrencias_fotos: fotosMap.get(row.id.toString()) || [],
      ocorrencias_trechos: trechosMap.get(row.id.toString()) || []
    };
    });

    // Contar total filtrado pelo projeto
    const countFilter = rodoviaIds.length > 0
      ? Prisma.sql`WHERE i.rodovia_id IN (${Prisma.join(rodoviaIds)})`
      : Prisma.empty;
    const totalResult = await safeQueryRaw<[{count: bigint}]>(
      Prisma.sql`SELECT COUNT(*) as count FROM ocorrencias o LEFT JOIN inspecoes i ON o.inspecao_id = i.id ${countFilter}`
    );
    const total = Number(totalResult[0].count);

    return { 
        success: true, 
        data: serialize(ocorrencias),
        pagination: {
            total,
            pages: Math.ceil(total / limit),
            current: page
        }
    };
  } catch (error: any) {
    console.error("Erro ao buscar ocorrências:", error);
    
    // Se o erro for de data inválida, retornar array vazio com aviso
    const errorString = String(error?.message || error || '');
    if (errorString.includes('invalid datetime') || 
        errorString.includes('out of range') ||
        errorString.includes('Value out of range') ||
        errorString.includes('day or month set to zero')) {
      console.warn("⚠️ Há dados com datas inválidas no banco. Retornando lista vazia.");
      return { 
        success: true, 
        data: [], 
        pagination: { total: 0, pages: 1, current: 1 },
        warning: "Existem ocorrências com datas inválidas no banco de dados. Por favor, corrija os dados."
      };
    }
    
    return { success: false, error: "Falha ao carregar ocorrências" };
  }
}

export async function getInspecoesForSelect() {
    try {
        const inspecoes = await prisma.inspecao.findMany({
            where: { status: { not: 'Concluido' } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                rodovias: { select: { nome: true } }
            }
        });
        
        const formatted = inspecoes.map(i => ({
            id: i.id.toString(),
            label: `${i.rodovias.nome} - ${new Date(i.periodoReferencia).toLocaleDateString('pt-BR', {month:'short', year:'numeric'})} (${i.status})`
        }));

        return { success: true, data: formatted };
    } catch (error) {
        return { success: false, error: "Erro ao buscar inspeções" };
    }
}

export async function getIndicadoresForSelect() {
    try {
        const indicadores = await prisma.indicador.findMany({
            orderBy: { sigla: 'asc' },
            select: { id: true, sigla: true, nome: true, grupo_id: true }
        });
        return { success: true, data: serialize(indicadores) };
    } catch (error) {
        return { success: false, error: "Erro ao carregar indicadores" };
    }
}

export async function getActiveInspection(projectSlug?: string) {
    try {
        // Build rodovia filter based on project - SECURITY: Use parameterized query
        let rodoviaIds: bigint[] = [];
        if (projectSlug) {
            // Get project's rodovias
            const project = await prisma.projects.findFirst({
                where: { 
                    OR: [
                        { slug: projectSlug },
                        { codigo: projectSlug }
                    ]
                },
                include: {
                    project_rodovias: {
                        select: { rodovia_id: true }
                    }
                }
            });
            
            if (project && project.project_rodovias.length > 0) {
                rodoviaIds = project.project_rodovias.map(pr => pr.rodovia_id);
            } else {
                // No rodovias for this project, return null
                return { success: true, data: null };
            }
        }
        
        // SECURITY: Use Prisma.sql for parameterized queries to prevent SQL injection
        const rodoviaFilter = rodoviaIds.length > 0 
            ? Prisma.sql`AND i.rodovia_id IN (${Prisma.join(rodoviaIds)})`
            : Prisma.empty;
        
        // Usar raw query para evitar erro de datetime inválido
        const inspections = await safeQueryRaw<any[]>(Prisma.sql`
            SELECT 
                i.id,
                i.uuid,
                i.status,
                i.rodovia_id,
                NULLIF(i.periodoReferencia, '0000-00-00') as periodoReferencia,
                r.nome as rodovia_nome
            FROM inspecoes i
            LEFT JOIN rodovias r ON i.rodovia_id = r.id
            WHERE i.status NOT IN ('Concluido', 'CONCLUIDA', 'PUBLICADA')
            ${rodoviaFilter}
            ORDER BY i.createdAt DESC
            LIMIT 1
        `);
        
        if (!inspections || inspections.length === 0) {
            return { success: true, data: null };
        }

        const inspection = inspections[0];
        
        // Formatar período de referência com tratamento de erro
        let labelPeriod = '';
        try {
            if (inspection.periodoReferencia) {
                labelPeriod = new Date(inspection.periodoReferencia).toLocaleDateString('pt-BR', {month:'short', year:'numeric'});
            } else {
                labelPeriod = 'Período não definido';
            }
        } catch (e) {
            labelPeriod = 'Período inválido';
        }

        const formatted = {
            id: inspection.id.toString(),
            rodovia_id: inspection.rodovia_id?.toString() || null,
            label: `${inspection.rodovia_nome || 'Sem rodovia'} - ${labelPeriod}`,
            status: inspection.status
        };

        return { success: true, data: formatted };
    } catch (error) {
        console.error("Erro ao buscar inspeção ativa:", error);
        return { success: false, error: "Erro ao buscar inspeção ativa" };
    }
}

export async function getGruposForSelect() {
    try {
        const grupos = await prisma.grupo.findMany({
            orderBy: { nome: 'asc' },
            select: { id: true, nome: true, sigla: true }
        });
        return { success: true, data: serialize(grupos) };
    } catch (error) {
        console.error("Erro ao buscar grupos:", error);
        return { success: false, error: "Erro ao carregar grupos" };
    }
}

export async function getSegmentosForSelect(projectSlug?: string) {
    try {
        let where: any = {};
        
        if (projectSlug) {
            const project = await prisma.projects.findFirst({
                where: { 
                    OR: [
                        { slug: projectSlug },
                        { codigo: projectSlug }
                    ]
                },
                include: {
                    project_rodovias: {
                        select: { rodovia_id: true }
                    }
                }
            });
            
            if (project && project.project_rodovias.length > 0) {
                const rodoviaIds = project.project_rodovias.map(pr => pr.rodovia_id);
                where = { rodovia_id: { in: rodoviaIds } };
            }
        }
        
        const segmentos = await prisma.segmentoHomogeneo.findMany({
            where,
            select: { 
                id: true, 
                nome: true, 
                kmInicial: true, 
                kmFinal: true,
                rodovia_id: true
            }
        });
        
        // Ordenar numericamente pelo número do segmento
        const sortedSegmentos = segmentos.sort((a, b) => {
            const numA = parseInt(a.nome.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.nome.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
        
        return { success: true, data: serialize(sortedSegmentos) };
    } catch (error) {
        console.error("Erro ao buscar segmentos:", error);
        return { success: false, error: "Erro ao carregar segmentos" };
    }
}

export async function createOcorrencia(prevState: any, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
             return { success: false, error: "Usuário não autenticado" };
        }

        const rawData = {
            inspecao_id: formData.get("inspecao_id"),
            indicador_id: formData.get("indicador_id"),
            grupo_id: formData.get("grupo_id"),
            data_hora: formData.get("data_hora"),
            descricao: formData.get("descricao"),
            lado: formData.get("lado"),
            pista: formData.get("pista"),
            segmento_id: formData.get("segmento_id"),
            km_inicial: formData.get("km_inicial"),
            km_final: formData.get("km_final"),
            valor_medido: formData.get("valor_medido"),
            unidade_medida: formData.get("unidade_medida"),
            dentro_do_limite: formData.get("dentro_do_limite"),
        };

        const validated = OcorrenciaSchema.parse(rawData);


        const data: any = {
            uuid: uuidv4(),
            inspecao_id: BigInt(validated.inspecao_id),
            dataHoraOcorrencia: new Date(validated.data_hora),
            anotacoes: validated.descricao,
            registroReferenteA: validated.indicador_id ? "Indicadores_de_desempenho" : "anota__es_de_campo",
            status: "ABERTA",
            lado: validated.lado,
            pistaFaixa: validated.pista
        };

        if (validated.indicador_id) {
            data.indicador_id = BigInt(validated.indicador_id);
        }

        if (validated.grupo_id) {
            data.grupo_id = BigInt(validated.grupo_id);
        }

        if (validated.valor_medido) {
            data.valor_medido = parseFloat(validated.valor_medido);
        }

        if (validated.unidade_medida) {
            data.unidade_medida = validated.unidade_medida;
        }

        if (validated.dentro_do_limite && validated.dentro_do_limite.length > 0) {
            data.dentro_do_limite = validated.dentro_do_limite === "sim";
        }

        const newOcorrencia = await prisma.ocorrencia.create({ data });

        // Create OcorrenciaTrecho if segmento is provided
        if (validated.segmento_id && validated.km_inicial) {
            await prisma.ocorrenciaTrecho.create({
                data: {
                    uuid: uuidv4(),
                    ocorrencia_id: newOcorrencia.id,
                    segmentoHomogeneo_id: BigInt(validated.segmento_id),
                    kmInicial: parseFloat(validated.km_inicial),
                    kmFinal: validated.km_final ? parseFloat(validated.km_final) : null,
                    ordem: 1
                }
            });
        }

        // Processar e salvar fotos no storage
        const photoFiles = formData.getAll('photos') as File[];
        if (photoFiles && photoFiles.length > 0) {
            const { uploadFile, getFileUrl } = await import('@/lib/s3');
            
            let ordem = 1;
            for (const file of photoFiles) {
                if (!file || typeof file === 'string' || file.size === 0) continue;
                
                try {
                    const ext = file.name.split('.').pop() || 'jpg';
                    const fileUuid = uuidv4();
                    const key = `ocorrencias/${newOcorrencia.id.toString()}/${fileUuid}.${ext}`;
                    
                    const result = await uploadFile(file, key, file.type);
                    
                    if (!result.success) {
                        console.error(`Erro ao enviar foto:`, result.error);
                        continue;
                    }
                    
                    const storagePath = result.key || key;
                    

                    await prisma.ocorrenciaFoto.create({
                        data: {
                            uuid: fileUuid,
                            ocorrencia_id: newOcorrencia.id,
                            caminhoArquivo: storagePath,
                            ordem: ordem,
                            dataHoraFoto: new Date()
                        }
                    });
                    
                    ordem++;
                } catch (photoError) {
                    console.error(`Erro ao salvar foto:`, photoError);
                }
            }
        }


        await logAudit({
            action: "CREATE",
            resource: "Ocorrencia",
            resourceId: newOcorrencia.id.toString(),
            actorId: session.user.id,
            actorEmail: session.user.email,
            actorRole: session.user.role as any, 
            details: { ...validated, uuid: newOcorrencia.uuid },
            severity: "INFO"
        });

        revalidatePath("/admin/registros");
        revalidatePath("/home");
        return { success: true, message: "Ocorrência registrada com sucesso!" };

    } catch (error: any) {
        console.error("Erro ao criar ocorrência:", error);
         if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || "Erro de validação" };
        }
        return { success: false, error: "Falha ao criar registro." };
    }
}
