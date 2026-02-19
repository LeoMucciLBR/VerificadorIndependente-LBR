"use server";

import { Prisma } from "@prisma/client";
import prisma, { safeQueryRaw } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export async function getHomeDashboardCards() {
  try {
    const cards = await prisma.dashboardCard.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        fases: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });
    
    const executions = cards.map(card => ({
      id: card.id,
      period: card.period,
      date: card.dateLabel,
      score: card.score
    }));

    return { success: true, data: executions };
  } catch (error) {
    console.error("Erro ao buscar cards da home:", error);
    return { success: false, error: "Falha ao carregar cards.", data: [] };
  }
}

/**
 * Busca execuções (inspeções) reais do banco para a timeline da síntese.
 */
export async function getTimelineExecutions(projectSlug?: string) {
  try {
    let rodoviaIds: bigint[] = [];
    let projectName = "—";

    if (projectSlug) {
      const project = await prisma.projects.findFirst({
        where: {
          OR: [
            { slug: projectSlug },
            { codigo: projectSlug }
          ]
        },
        include: {
          project_rodovias: { select: { rodovia_id: true } }
        }
      });

      if (project && project.project_rodovias.length > 0) {
        rodoviaIds = project.project_rodovias.map((pr) => pr.rodovia_id);
        projectName = project.nome || "—";
      } else {
        return { success: true, data: [] };
      }
    }

    const rodoviaFilter = rodoviaIds.length > 0
      ? Prisma.sql`WHERE i.rodovia_id IN (${Prisma.join(rodoviaIds)})`
      : Prisma.empty;

    const rawExecutions = await safeQueryRaw<any[]>(Prisma.sql`
      SELECT 
        i.id,
        i.uuid,
        NULLIF(i.periodoReferencia, '0000-00-00') as periodoReferencia,
        NULLIF(i.dataInicioVistoria, '0000-00-00 00:00:00') as dataInicioVistoria,
        NULLIF(i.dataFimVistoria, '0000-00-00 00:00:00') as dataFimVistoria,
        i.descricaoVistoria,
        i.status,
        i.nota,
        i.is_official,
        f.nome as fase_nome,
        r.nome as rodovia_nome,
        r.codigo as rodovia_codigo,
        u.name as user_name,
        (SELECT COUNT(*) FROM ocorrencias o WHERE o.inspecao_id = i.id) as ocorrencias_count
      FROM inspecoes i
      LEFT JOIN fases f ON i.fase_id = f.id
      LEFT JOIN rodovias r ON i.rodovia_id = r.id
      LEFT JOIN users u ON i.usuario_id = u.id
      ${rodoviaFilter}
      ORDER BY NULLIF(i.periodoReferencia, '0000-00-00') IS NULL, NULLIF(i.periodoReferencia, '0000-00-00') ASC
    `);
    // Buscar indicadores e fórmulas para cada execução
    const executionIds = rawExecutions.map(r => BigInt(r.id));
    const faseIds = rawExecutions.map(r => r.fase_id).filter(Boolean).map(id => BigInt(id));

    // Ocorrências com indicadores (agrupados via raw SQL para evitar erros de enum inválido)
    let ocorrenciasByExec: Record<string, any[]> = {};
    if (executionIds.length > 0) {
      try {
        const rawIndicators = await safeQueryRaw<any[]>(Prisma.sql`
          SELECT 
            o.inspecao_id,
            ind.id as indicador_id,
            ind.sigla,
            ind.nome as indicador_nome,
            COUNT(*) as total
          FROM ocorrencias o
          LEFT JOIN indicadores ind ON o.indicador_id = ind.id
          WHERE o.inspecao_id IN (${Prisma.join(executionIds)})
          GROUP BY o.inspecao_id, ind.id
        `);
        for (const row of rawIndicators) {
          const key = String(row.inspecao_id);
          if (!ocorrenciasByExec[key]) ocorrenciasByExec[key] = [];
          if (row.indicador_id) {
            ocorrenciasByExec[key].push({
              id: String(row.indicador_id),
              sigla: row.sigla || "",
              nome: row.indicador_nome || "",
              count: Number(row.total)
            });
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar indicadores para timeline:", e);
      }
    }

    // Fórmulas via fases
    let formulasByFase: Record<string, any[]> = {};
    if (faseIds.length > 0) {
      try {
        const uniqueFaseIds = [...new Set(faseIds.map(id => id))];
        const formulasFases = await prisma.formulaFase.findMany({
          where: { fase_id: { in: uniqueFaseIds } },
          include: { formulas: true }
        });
        for (const ff of formulasFases) {
          const key = String(ff.fase_id);
          if (!formulasByFase[key]) formulasByFase[key] = [];
          if (ff.formulas) formulasByFase[key].push(ff.formulas);
        }
      } catch (e) {
        console.warn("Erro ao buscar fórmulas para timeline:", e);
      }
    }

    const executions = rawExecutions.map(row => {
      const execId = String(row.id);
      const faseId = row.fase_id ? String(row.fase_id) : null;
      const indicators = ocorrenciasByExec[execId] || [];
      const totalOcorrencias = indicators.reduce((sum: number, ind: any) => sum + ind.count, 0);

      return {
        id: execId,
        periodoReferencia: row.periodoReferencia,
        dataInicioVistoria: row.dataInicioVistoria,
        dataFimVistoria: row.dataFimVistoria,
        descricaoVistoria: row.descricaoVistoria || "",
        status: row.status || "Pendente",
        nota: row.nota != null ? Number(row.nota) : null,
        isOfficial: !!row.is_official,
        faseNome: row.fase_nome || "",
        rodoviaNome: row.rodovia_nome || "",
        rodoviaCodigo: row.rodovia_codigo || "",
        userName: row.user_name || "",
        projectNome: projectName,
        ocorrenciasCount: totalOcorrencias,
        indicadores: indicators,
        formulas: faseId ? (formulasByFase[faseId] || []) : [],
      };
    });

    return { success: true, data: serialize(executions) };
  } catch (error: any) {
    console.error("Erro ao buscar execuções para timeline:", error);

    const msg = String(error?.message || "");
    if (msg.includes("invalid datetime") || msg.includes("Value out of range")) {
      return { success: true, data: [] };
    }

    return { success: false, error: "Falha ao carregar execuções.", data: [] };
  }
}
