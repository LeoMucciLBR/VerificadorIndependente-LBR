"use server";

import { Prisma } from "@prisma/client";
import prisma, { safeQueryRaw } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { serialize } from "@/lib/serialize";

const ExecutionSchema = z.object({
  fase_id: z.coerce.number().min(1, "Selecione uma fase"),
  rodovia_id: z.coerce.number().min(1, "Selecione uma rodovia"),
  segmento_homogeneo_id: z.coerce.number().optional(),
  data_inicio: z.string().min(1, "Data de início obrigatória"),
  data_fim: z.string().min(1, "Data de fim obrigatória"),
  periodo_referencia: z.string().min(1, "Período obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  is_official: z.boolean().default(false),
});

export async function getExecutions(projectSlug?: string) {
  try {
    let rodoviaIds: bigint[] = [];
    let project: any = null;
    
    if (projectSlug) {
      project = await prisma.projects.findFirst({
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
        rodoviaIds = project.project_rodovias.map((pr: any) => pr.rodovia_id);
      } else {
        // If project found but no rodovias, return empty
        if (project) return { success: true, data: [] };
        // If no project found with that slug, maybe it's not filtering by project? 
        // For now, let's allow fetching all if no slug matches, OR return empty.
        // Returning empty is safer.
        console.warn("Project not found or no rodovias for slug:", projectSlug);
        return { success: true, data: [] };
      }
    }
    
    // Query parametrizada para evitar SQL injection
    const rodoviaFilter = rodoviaIds.length > 0
      ? Prisma.sql`WHERE i.rodovia_id IN (${Prisma.join(rodoviaIds)})`
      : Prisma.empty; // If no projectSlug, fetching all? Careful.

    // If rodoviaIds is empty and projectSlug WAS provided, we already returned.
    // So here, either no projectSlug provided (fetch all?) or filter applies.
    
    // Safety check: if no projectSlug and fetching all is not desired, we should restrict.
    // Assuming if no slug, we might be in admin view or global view.
    
    const rawExecutions = await safeQueryRaw<any[]>(Prisma.sql`
      SELECT 
        i.id,
        i.uuid,
        i.rodovia_id,
        i.usuario_id,
        NULLIF(i.periodoReferencia, '0000-00-00') as periodoReferencia,
        NULLIF(i.dataInicioVistoria, '0000-00-00 00:00:00') as dataInicioVistoria,
        NULLIF(i.dataFimVistoria, '0000-00-00 00:00:00') as dataFimVistoria,
        i.descricaoVistoria,
        i.sincronizado,
        i.createdAt,
        i.updatedAt,
        i.fase_id,
        i.is_official,
        i.status,
        i.nota,
        i.assinatura_caminho,
        f.id as fase_id_rel,
        f.nome as fase_nome,
        f.isActive as fase_isActive,
        r.id as rodovia_id_rel,
        r.nome as rodovia_nome,
        r.codigo as rodovia_codigo,
        r.extensao as rodovia_extensao,
        u.name as user_name,
        u.email as user_email,
        u.avatar as user_avatar
      FROM inspecoes i
      LEFT JOIN fases f ON i.fase_id = f.id
      LEFT JOIN rodovias r ON i.rodovia_id = r.id
      LEFT JOIN users u ON i.usuario_id = u.id
      ${rodoviaFilter}
      GROUP BY i.id
      ORDER BY i.createdAt DESC
    `);


    const executions = rawExecutions.map(row => ({
      id: row.id,
      uuid: row.uuid,
      rodovia_id: row.rodovia_id,
      usuario_id: row.usuario_id,
      periodoReferencia: row.periodoReferencia,
      dataInicioVistoria: row.dataInicioVistoria,
      dataFimVistoria: row.dataFimVistoria,
      descricaoVistoria: row.descricaoVistoria,
      sincronizado: row.sincronizado,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      fase_id: row.fase_id,
      is_official: row.is_official,
      status: row.status,
      nota: row.nota,
      assinatura_caminho: row.assinatura_caminho,
      fase: row.fase_id_rel ? {
        id: row.fase_id_rel,
        nome: row.fase_nome,
        isActive: row.fase_isActive
      } : null,
      rodovias: row.rodovia_id_rel ? {
        id: row.rodovia_id_rel,
        nome: row.rodovia_nome,
        codigo: row.rodovia_codigo,
        extensao: row.rodovia_extensao
      } : null,
      users: row.user_name ? {
        name: row.user_name,
        email: row.user_email,
        avatar: row.user_avatar
      } : null,
      project: project ? {
        id: project.id,
        nome: project.nome,
        codigo: project.codigo,
        slug: project.slug
      } : null
    }));

    return { success: true, data: serialize(executions) };
  } catch (error: any) {
    console.error("Erro ao buscar execuções:", error);
    
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
        warning: "Existem inspeções com datas inválidas no banco de dados (dia ou mês = 0). Execute o script fix-invalid-dates.sql para corrigir."
      };
    }
    
    return { success: false, error: "Falha ao buscar execuções" };
  }
}

export async function getFases() {
  try {
    const fases = await prisma.fase.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' }
    });
    return { success: true, data: serialize(fases) };
  } catch (error) {
    return { success: false, error: "Erro ao buscar fases" };
  }
}

export async function getRodoviasWithSegments(projectId?: string | null) {
  try {
    const rodovias = await prisma.rodovia.findMany({
      where: projectId ? { project_id: BigInt(projectId) } : undefined,
      include: {
        segmentos_homogeneos: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            kmInicial: true,
            kmFinal: true
          },
          orderBy: {
            kmInicial: 'asc'
          }
        }
      },
      orderBy: { nome: 'asc' }
    });
    return { success: true, data: serialize(rodovias) };
  } catch (error) {
    return { success: false, error: "Erro ao buscar rodovias" };
  }
}

export async function createExecution(prevState: any, formData: FormData) {
  try {
    const rawData = {
      fase_id: formData.get("fase_id"),
      rodovia_id: formData.get("rodovia_id"),
      segmento_homogeneo_id: formData.get("segmento_homogeneo_id"),
      data_inicio: formData.get("data_inicio"),
      data_fim: formData.get("data_fim"),
      periodo_referencia: formData.get("periodo_referencia"),
      descricao: formData.get("descricao"),
      is_official: formData.get("is_official") === "on",
    };

    const session = await getSession();
    if (!session || !session.user) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const validated = ExecutionSchema.parse(rawData);

    let finalDescription = validated.descricao;
    if (validated.segmento_homogeneo_id) {
       const segment = await prisma.segmentoHomogeneo.findUnique({where: {id: BigInt(validated.segmento_homogeneo_id)}});
       if (segment) {
         finalDescription = `[Segmento: ${segment.nome}] ${finalDescription}`;
       }
    }

    try {
        const execution = await prisma.inspecao.create({
            data: {
                uuid: uuidv4(),
                rodovia_id: BigInt(validated.rodovia_id),
                fase_id: BigInt(validated.fase_id),
                usuario_id: BigInt(session.userId),
                dataInicioVistoria: new Date(validated.data_inicio),
                dataFimVistoria: new Date(validated.data_fim),
                periodoReferencia: new Date(`${validated.periodo_referencia}-01T12:00:00`),
                descricaoVistoria: finalDescription,
                is_official: validated.is_official,
                status: "Pendente",
                nota: null
            }
        });


        try {
            await logAudit({
                action: "CREATE",
                resource: "Inspecao",
                resourceId: execution.id.toString(),
                actorId: session.userId,
                actorEmail: session.user.email,
                actorRole: session.user.role as any, 
                details: { ...validated, uuid: execution.uuid },
                severity: "INFO"
            });
        } catch (e) {
            console.error("Erro no log de auditoria:", e);
        }

        revalidatePath("/home");
        return { success: true, message: "Execução cadastrada com sucesso!" };
    } catch (dbError: any) {
        console.error("Erro de banco ao criar execução:", dbError);
        return { success: false, error: "Erro de banco de dados" };
    }
  } catch (error: any) {
    console.error("Erro ao criar execução:", error);
    if (error instanceof z.ZodError) {
       return { success: false, error: error.issues[0]?.message || "Erro de validação" };
    }
    return { success: false, error: error.message || "Erro ao criar execução." };
  }
}

export async function getExecutionDetails(id: string) {
  try {
    // Raw query para tratar datas inválidas (0000-00-00)
    const rawExecution = await safeQueryRaw<any[]>(Prisma.sql`
      SELECT 
        i.id,
        i.uuid,
        i.rodovia_id,
        i.usuario_id,
        NULLIF(i.periodoReferencia, '0000-00-00') as periodoReferencia,
        NULLIF(i.dataInicioVistoria, '0000-00-00 00:00:00') as dataInicioVistoria,
        NULLIF(i.dataFimVistoria, '0000-00-00 00:00:00') as dataFimVistoria,
        i.descricaoVistoria,
        i.sincronizado,
        i.createdAt,
        i.updatedAt,
        i.fase_id,
        i.is_official,
        i.status,
        i.nota,
        i.assinatura_caminho,
        f.id as fase_id_rel,
        f.nome as fase_nome,
        f.isActive as fase_isActive,
        r.id as rodovia_id_rel,
        r.nome as rodovia_nome,
        r.codigo as rodovia_codigo,
        r.extensao as rodovia_extensao,
        u.name as user_name,
        u.email as user_email
      FROM inspecoes i
      LEFT JOIN fases f ON i.fase_id = f.id
      LEFT JOIN rodovias r ON i.rodovia_id = r.id
      LEFT JOIN users u ON i.usuario_id = u.id
      WHERE i.id = ${BigInt(id)}
    `);

    if (!rawExecution || rawExecution.length === 0) {
      return { success: false, error: "Execução não encontrada" };
    }

    const row = rawExecution[0];

    let ocorrencias: any[] = [];
    try {
      // Raw query para evitar validação de enum (produção tem valores como 'Direito'/'Ambos' que não batem com o schema)
      const rawOcorrencias = await safeQueryRaw<any[]>(Prisma.sql`
        SELECT 
          o.id, o.uuid, o.inspecao_id, o.indicador_id, o.grupo_id,
          NULLIF(o.dataHoraOcorrencia, '0000-00-00 00:00:00') as dataHoraOcorrencia,
          o.anotacoes, o.registroReferenteA, o.status, o.lado, o.pistaFaixa,
          o.valor_medido, o.unidade_medida, o.dentro_do_limite,
          NULLIF(o.createdAt, '0000-00-00 00:00:00') as createdAt,
          NULLIF(o.updatedAt, '0000-00-00 00:00:00') as updatedAt,
          ind.id as ind_id, ind.nome as ind_nome, ind.sigla as ind_sigla,
          ind.descricao as ind_descricao, ind.grupo_id as ind_grupo_id
        FROM ocorrencias o
        LEFT JOIN indicadores ind ON o.indicador_id = ind.id
        WHERE o.inspecao_id = ${BigInt(id)}
      `);

      // Buscar fotos separadamente (sem enum problemático)
      const fotosByOcorrencia: Record<string, any[]> = {};
      if (rawOcorrencias.length > 0) {
        const ocIds = rawOcorrencias.map(o => BigInt(o.id));
        const fotos = await prisma.ocorrenciaFoto.findMany({
          where: { ocorrencia_id: { in: ocIds } }
        });
        fotos.forEach(f => {
          const key = f.ocorrencia_id.toString();
          if (!fotosByOcorrencia[key]) fotosByOcorrencia[key] = [];
          fotosByOcorrencia[key].push(f);
        });
      }

      ocorrencias = rawOcorrencias.map(o => ({
        ...o,
        indicadores: o.ind_id ? {
          id: o.ind_id, nome: o.ind_nome, sigla: o.ind_sigla,
          descricao: o.ind_descricao, grupo_id: o.ind_grupo_id
        } : null,
        ocorrencias_fotos: fotosByOcorrencia[o.id.toString()] || []
      }));
    } catch (ocError: any) {
      console.warn("Erro ao buscar ocorrências:", ocError?.message);
      ocorrencias = [];
    }

    // Buscar projeto associado à rodovia
    let project = null;
    if (row.rodovia_id) {
      const projectRodovia = await prisma.project_rodovias.findFirst({
        where: { rodovia_id: BigInt(row.rodovia_id) },
        include: { projects: { select: { id: true, nome: true, codigo: true, slug: true } } }
      });
      if (projectRodovia?.projects) {
        project = projectRodovia.projects;
      }
    }


    const execution = {
      id: row.id,
      uuid: row.uuid,
      rodovia_id: row.rodovia_id,
      usuario_id: row.usuario_id,
      periodoReferencia: row.periodoReferencia,
      dataInicioVistoria: row.dataInicioVistoria,
      dataFimVistoria: row.dataFimVistoria,
      descricaoVistoria: row.descricaoVistoria,
      sincronizado: row.sincronizado,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      fase_id: row.fase_id,
      is_official: row.is_official,
      status: row.status,
      nota: row.nota,
      assinatura_caminho: row.assinatura_caminho,
      fase: row.fase_id_rel ? {
        id: row.fase_id_rel,
        nome: row.fase_nome,
        isActive: row.fase_isActive
      } : null,
      rodovias: row.rodovia_id_rel ? {
        id: row.rodovia_id_rel,
        nome: row.rodovia_nome,
        codigo: row.rodovia_codigo,
        extensao: row.rodovia_extensao
      } : null,
      users: row.user_name ? {
        name: row.user_name,
        email: row.user_email
      } : null,
      project: project,
      ocorrencias: ocorrencias
    };

    return { success: true, data: serialize(execution) };
  } catch (error) {
    console.error("Erro ao buscar detalhes da execução:", error);
    return { success: false, error: "Erro ao buscar detalhes da execução" };
  }
}
