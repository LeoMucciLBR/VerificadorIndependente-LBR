"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
// StatusMedicao is now a string in database, no need to import

export async function getMedicoesInputGrid(competencia: Date, faseId: string) {
  try {
    // 1. Buscar a Fase e suas Caracterizações (que ligam aos Indicadores)
    // Precisamos saber QUAIS indicadores devem ser medidos nesta fase.
    const fase = await prisma.fase.findUnique({
      where: { id: BigInt(faseId) },
      include: {
        caracterizacoes_fases: {
          include: {
            caracterizacoes: {
              include: {
                indicadores: {
                  include: {
                    grupos: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!fase) return { success: false, error: "Fase não encontrada" };

    // 2. Buscar Medições já lançadas para esta competência (mês) e fase
    const medicoesExistentes = await prisma.medicao.findMany({
      where: {
        fase_id: BigInt(faseId),
        competencia: competencia // Assume que o frontend manda o dia 01 exato
      }
    });

    const mapMedicoes = new Map();
    medicoesExistentes.forEach(m => {
      mapMedicoes.set(m.indicador_id, m);
    });

    // 3. Montar estrutura hierárquica para o Grid
    // O objetivo é retornar uma lista de Grupos -> Indicadores,
    // marcada com o valor atual se existir.
    
    // Extrair indicadores ativos
    const indicadoresAtivos = fase.caracterizacoes_fases
      .map((c) => c.caracterizacoes.indicadores)
      // Remove duplicates if any (though caracterizacao per indicator/phase should be unique ideally)
      .filter((ind, index, self) => 
        index === self.findIndex((t) => t.id === ind.id)
      );

    // Agrupar por Grupo (simples, apenas 1 nível ou recursivo se precisarmos, 
    // mas para o grid flat com headers de grupo é mais fácil)
    
    // Vamos retornar flat list enriquecida, o frontend agrupa se quiser
    const gridData = indicadoresAtivos.map((ind) => {
      const medicao = mapMedicoes.get(ind.id);
      return {
        indicador: {
          id: ind.id,
          nome: ind.nome,
          sigla: ind.sigla,
          unidade: ind.unidadeMedida,
          grupo: ind.grupos.nome
        },
        medicao: medicao ? {
          id: medicao.id,
          valor: medicao.valor,
          status: medicao.status,
          observacoes: medicao.observacoes,
          ultimoUpdate: medicao.atualizadoEm
        } : null
      };
    });
    
    // Sort by Group Name then Indicator Name
    gridData.sort((a, b) => {
        if (a.indicador.grupo < b.indicador.grupo) return -1;
        if (a.indicador.grupo > b.indicador.grupo) return 1;
        return a.indicador.nome.localeCompare(b.indicador.nome);
    });

    return { 
        success: true, 
        data: gridData,
        meta: {
            faseNome: fase.nome,
            competenciaISO: competencia.toISOString()
        }
    };

  } catch (error) {
    console.error("Erro ao buscar grid de medições:", error);
    return { success: false, error: "Falha ao carregar dados de medição." };
  }
}

export async function upsertMedicao(data: {
  competencia: Date | string,
  faseId: string,
  indicadorId: string,
  valor: number,
  observacoes?: string
}) {
  try {
    const { competencia, faseId, indicadorId, valor, observacoes } = data;
    const compDate = new Date(competencia);

    // TODO: Get real user
    const user = await prisma.user.findFirst(); 
    if (!user) throw new Error("Usuário não encontrado");

    const medicao = await prisma.medicao.upsert({
      where: {
        competencia_indicador_id_fase_id: {
          competencia: compDate,
          indicador_id: BigInt(indicadorId),
          fase_id: BigInt(faseId)
        }
      },
      update: {
        valor,
        observacoes,
        // status? Mante-se o atual ou reabre?
      },
      create: {
        uuid: randomUUID(),
        competencia: compDate,
        indicador_id: BigInt(indicadorId),
        fase_id: BigInt(faseId),
        valor,
        observacoes,
        criadoPor_user_id: user.id
      }
    });

    revalidatePath("/admin/medicoes");
    return { success: true, data: medicao };
  } catch (error) {
    console.error("Erro ao salvar medição:", error);
    return { success: false, error: "Falha ao salvar valor." };
  }
}
