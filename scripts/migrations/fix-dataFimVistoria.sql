-- ========================================
-- CORRIGIR dataFimVistoria COM VALORES INVÁLIDOS
-- ========================================

-- PASSO 1: Identificar os registros problemáticos
SELECT 
    id,
    uuid,
    dataInicioVistoria,
    dataFimVistoria,
    createdAt,
    status
FROM inspecoes
WHERE 
    dataFimVistoria = '0000-00-00 00:00:00' 
    OR dataFimVistoria = '0000-00-00'
    OR dataFimVistoria IS NULL
    OR YEAR(dataFimVistoria) = 0
    OR MONTH(dataFimVistoria) = 0
    OR DAY(dataFimVistoria) = 0;

-- ========================================
-- PASSO 2: CORRIGIR AS DATAS (AGUARDA PERMISSÃO)
-- ========================================
-- Execute apenas APÓS revisar os registros acima

SET SQL_SAFE_UPDATES = 0;

UPDATE inspecoes
SET dataFimVistoria = COALESCE(
    -- Tentar usar dataInicioVistoria se for válida
    CASE 
        WHEN dataInicioVistoria IS NOT NULL 
         AND dataInicioVistoria != '0000-00-00' 
         AND dataInicioVistoria != '0000-00-00 00:00:00'
         AND YEAR(dataInicioVistoria) > 0
        THEN dataInicioVistoria
        ELSE NULL
    END,
    -- Caso contrário, usar createdAt
    createdAt,
    -- Último recurso: data atual
    NOW()
)
WHERE 
    dataFimVistoria = '0000-00-00 00:00:00' 
    OR dataFimVistoria = '0000-00-00'
    OR dataFimVistoria IS NULL
    OR YEAR(dataFimVistoria) = 0
    OR MONTH(dataFimVistoria) = 0
    OR DAY(dataFimVistoria) = 0;

SET SQL_SAFE_UPDATES = 1;

-- ========================================
-- PASSO 3: VERIFICAR SE FOI CORRIGIDO
-- ========================================
SELECT COUNT(*) as registros_ainda_invalidos
FROM inspecoes
WHERE 
    dataFimVistoria = '0000-00-00 00:00:00' 
    OR dataFimVistoria = '0000-00-00'
    OR dataFimVistoria IS NULL
    OR YEAR(dataFimVistoria) = 0
    OR MONTH(dataFimVistoria) = 0
    OR DAY(dataFimVistoria) = 0;

-- Se retornar 0, sucesso!

-- ========================================
-- PASSO 4: Ver como ficaram os registros corrigidos
-- ========================================
SELECT 
    id,
    uuid,
    dataInicioVistoria,
    dataFimVistoria,
    status
FROM inspecoes
ORDER BY id DESC
LIMIT 10;
