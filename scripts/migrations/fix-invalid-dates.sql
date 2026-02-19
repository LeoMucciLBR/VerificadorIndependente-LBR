-- ========================================
-- SCRIPT PARA IDENTIFICAR E CORRIGIR DATAS INVÁLIDAS
-- NÃO EXECUTE DIRETAMENTE - REVISE PRIMEIRO!
-- ========================================

-- 1. IDENTIFICAR inspeções com datas inválidas
-- Execute este primeiro para ver quais registros estão com problema
SELECT 
    id,
    uuid,
    periodoReferencia,
    dataInicioVistoria,
    dataFimVistoria,
    status,
    createdAt
FROM inspecoes
WHERE 
    periodoReferencia = '0000-00-00' 
    OR periodoReferencia IS NULL
    OR YEAR(periodoReferencia) = 0
    OR MONTH(periodoReferencia) = 0
    OR DAY(periodoReferencia) = 0;

-- ========================================
-- 2. CORRIGIR TODAS as datas inválidas
-- ========================================

-- IMPORTANTE: Execute todos estes comandos juntos
SET SQL_SAFE_UPDATES = 0;

-- Corrigir periodoReferencia
UPDATE inspecoes
SET periodoReferencia = DATE_FORMAT(COALESCE(createdAt, NOW()), '%Y-%m-01')
WHERE 
    periodoReferencia = '0000-00-00' 
    OR periodoReferencia IS NULL
    OR YEAR(periodoReferencia) = 0
    OR MONTH(periodoReferencia) = 0
    OR DAY(periodoReferencia) = 0;

-- Corrigir dataInicioVistoria
UPDATE inspecoes
SET dataInicioVistoria = COALESCE(createdAt, NOW())
WHERE 
    dataInicioVistoria = '0000-00-00' 
    OR dataInicioVistoria IS NULL
    OR YEAR(dataInicioVistoria) = 0
    OR MONTH(dataInicioVistoria) = 0
    OR DAY(dataInicioVistoria) = 0;

-- Corrigir dataFimVistoria
UPDATE inspecoes
SET dataFimVistoria = COALESCE(dataInicioVistoria, createdAt, NOW())
WHERE 
    dataFimVistoria = '0000-00-00' 
    OR dataFimVistoria IS NULL
    OR YEAR(dataFimVistoria) = 0
    OR MONTH(dataFimVistoria) = 0
    OR DAY(dataFimVistoria) = 0;

SET SQL_SAFE_UPDATES = 1;

SELECT 'Datas corrigidas com sucesso!' AS status;

-- ========================================
-- 3. VERIFICAR se ainda há datas inválidas
-- ========================================
SELECT COUNT(*) as total_invalidas
FROM inspecoes
WHERE 
    periodoReferencia = '0000-00-00' 
    OR periodoReferencia IS NULL
    OR YEAR(periodoReferencia) = 0
    OR MONTH(periodoReferencia) = 0
    OR DAY(periodoReferencia) = 0;

-- Se retornar 0, todas as datas foram corrigidas!

-- ========================================
-- 4. VERIFICAR ocorrências com datas inválidas (se houver)
-- ========================================
SELECT 
    id,
    uuid,
    dataHoraOcorrencia,
    status,
    createdAt
FROM ocorrencias
WHERE 
    dataHoraOcorrencia = '0000-00-00 00:00:00' 
    OR dataHoraOcorrencia IS NULL
    OR YEAR(dataHoraOcorrencia) = 0
    OR MONTH(dataHoraOcorrencia) = 0
    OR DAY(dataHoraOcorrencia) = 0;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute o SELECT (item 1) para ver quais registros têm problema
-- 2. Escolha uma das OPÇÕES (A, B ou C) no item 2
-- 3. Descomente a opção escolhida removendo os /* */
-- 4. Execute o UPDATE escolhido
-- 5. Execute o SELECT (item 3) para confirmar que foram corrigidos
-- 6. Recarregue a página /execucoes no navegador
