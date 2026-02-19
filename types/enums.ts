export enum AreaAtuacao {
  INFRAESTRUTURA = "INFRAESTRUTURA",
  MEIO_AMBIENTE = "MEIO_AMBIENTE",
  SOCIAL = "SOCIAL",
  ECONOMICO = "ECONOMICO",
  GESTAO = "GESTAO",
  QUALIDADE = "QUALIDADE",
  // Additional values used in IndicatorList
  FAIXA = "FAIXA",
  PAVIMENTO = "PAVIMENTO",
  SINALIZACAO = "SINALIZACAO",
  DRENAGEM = "DRENAGEM",
  OBRAS_ARTE = "OBRAS_ARTE"
}

export const AREA_ATUACAO_LABELS: Record<AreaAtuacao, string> = {
  [AreaAtuacao.INFRAESTRUTURA]: "Infraestrutura",
  [AreaAtuacao.MEIO_AMBIENTE]: "Meio Ambiente",
  [AreaAtuacao.SOCIAL]: "Social",
  [AreaAtuacao.ECONOMICO]: "Econômico",
  [AreaAtuacao.GESTAO]: "Gestão",
  [AreaAtuacao.QUALIDADE]: "Qualidade",
  [AreaAtuacao.FAIXA]: "Faixa de Domínio",
  [AreaAtuacao.PAVIMENTO]: "Pavimento",
  [AreaAtuacao.SINALIZACAO]: "Sinalização",
  [AreaAtuacao.DRENAGEM]: "Drenagem",
  [AreaAtuacao.OBRAS_ARTE]: "Obras de Arte Especiais"
};

export enum TipoRetorno {
  NUMERICO = "NUMERICO",
  PERCENTUAL = "PERCENTUAL",
  BOOLEANO = "BOOLEANO",
  TEXTO = "TEXTO"
}

export const TIPO_RETORNO_LABELS: Record<TipoRetorno, string> = {
  [TipoRetorno.NUMERICO]: "Numérico",
  [TipoRetorno.PERCENTUAL]: "Percentual",
  [TipoRetorno.BOOLEANO]: "Booleano (Sim/Não)",
  [TipoRetorno.TEXTO]: "Texto"
};

// Union types for Prisma compatibility (String-based schema)
export type AreaAtuacaoValue = `${AreaAtuacao}`;
export type TipoRetornoValue = `${TipoRetorno}`;
export type RoleValue = "SUPER_ADMIN" | "ADMIN" | "AUDITOR" | "USER";
export type AuditSeverityValue = "INFO" | "WARNING" | "CRITICAL";
export type ActionTypeValue = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT" | "VIEW" | "SYSTEM_ALERT";
export type StatusMedicaoValue = "ABERTO" | "FECHADO" | "APROVADO";
export type StatusOcorrenciaValue = "ABERTA" | "CRITICA" | "ENCERRADA";
export type RegistroReferenteAValue = "Indicadores de desempenho" | "anotações de campo";
export type LadoValue = "Esquerdo" | "direito" | "ambos";
export type PistaFaixaValue = "FT01" | "FT01/FT02" | "FT02" | "FD" | "AC" | "CC";
export type TableNameValue = "FASE" | "GRUPO" | "INDICADOR" | "CARACTERIZACAO" | "CONSTANTE" | "VARIAVEL" | "INSTITUICAO" | "USER" | "FORMULA";

// Type guards for runtime validation
export function isValidAreaAtuacao(value: string): value is AreaAtuacaoValue {
  return Object.values(AreaAtuacao).includes(value as AreaAtuacao);
}

export function isValidTipoRetorno(value: string): value is TipoRetornoValue {
  return Object.values(TipoRetorno).includes(value as TipoRetorno);
}

export function isValidRole(value: string): value is RoleValue {
  return ["SUPER_ADMIN", "ADMIN", "AUDITOR", "USER"].includes(value);
}

export function isValidAuditSeverity(value: string): value is AuditSeverityValue {
  return ["INFO", "WARNING", "CRITICAL"].includes(value);
}

export function isValidActionType(value: string): value is ActionTypeValue {
  return ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT", "VIEW", "SYSTEM_ALERT"].includes(value);
}

export function isValidStatusMedicao(value: string): value is StatusMedicaoValue {
  return ["ABERTO", "FECHADO", "APROVADO"].includes(value);
}

export function isValidStatusOcorrencia(value: string): value is StatusOcorrenciaValue {
  return ["ABERTA", "CRITICA", "ENCERRADA"].includes(value);
}
