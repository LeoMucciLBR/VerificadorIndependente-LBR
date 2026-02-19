-- ========================================
-- ADICIONAR E POPULAR COLUNAS kmInicialKML e kmFinalKML
-- ========================================

-- PASSO 1: Adicionar as colunas (caso ainda não existam)
ALTER TABLE segmentos_homogeneos 
ADD COLUMN IF NOT EXISTS kmInicialKML DECIMAL(10,3) NULL,
ADD COLUMN IF NOT EXISTS kmFinalKML DECIMAL(10,3) NULL;

-- PASSO 2: Popular os valores com base no KML geral
-- Cada segmento recebe os KMs do arquivo KML oficial

-- Segmento 1 – MT 246 (ID 12)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 112.366, kmFinalKML = 153.066 
WHERE id = 12;

-- Segmento 2 – MT 246 (ID 13)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 153.066, kmFinalKML = 192.866 
WHERE id = 13;

-- Segmento 3 – MT 246 / MT 343 (ID 14)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 192.866, kmFinalKML = 196.966 
WHERE id = 14;

-- Segmento 4 – MT 343 (ID 15)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 229.200, kmFinalKML = 247.200 
WHERE id = 15;

-- Segmento 5 – MT 343 / MT 358 (ID 16)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 0.000, kmFinalKML = 1.300 
WHERE id = 16;

-- Segmento 6 – MT 358 (ID 17)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 1.300, kmFinalKML = 15.300 
WHERE id = 17;

-- Segmento 7 – MT 358 (ID 18)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 15.300, kmFinalKML = 19.100 
WHERE id = 18;

-- Segmento 8 – MT 358 (ID 19)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 19.100, kmFinalKML = 46.000 
WHERE id = 19;

-- Segmento 9 – MT 358 (ID 20)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 46.000, kmFinalKML = 63.400 
WHERE id = 20;

-- Segmento 10 – MT 358 (ID 21)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 63.400, kmFinalKML = 127.000 
WHERE id = 21;

-- Segmento 11 – MT 480 (Contorno) (ID 22)
UPDATE segmentos_homogeneos 
SET kmInicialKML = 0.000, kmFinalKML = 3.700 
WHERE id = 22;

-- ========================================
-- VERIFICAÇÃO: Ver os valores atualizados
-- ========================================
SELECT 
    id,
    nome,
    kmInicial as km_interno_inicio,
    kmFinal as km_interno_fim,
    kmInicialKML as km_kml_inicio,
    kmFinalKML as km_kml_fim,
    CONCAT(
        'Δ Início: ', 
        ROUND(ABS(kmInicial - kmInicialKML), 3),
        ' | Δ Fim: ',
        ROUND(ABS(kmFinal - kmFinalKML), 3)
    ) as diferencas
FROM segmentos_homogeneos
WHERE id BETWEEN 12 AND 22
ORDER BY id;

-- ========================================
-- RESUMO
-- ========================================
SELECT 
    'Total de segmentos atualizados' as info,
    COUNT(*) as quantidade
FROM segmentos_homogeneos
WHERE kmInicialKML IS NOT NULL 
  AND kmFinalKML IS NOT NULL
  AND id BETWEEN 12 AND 22;
