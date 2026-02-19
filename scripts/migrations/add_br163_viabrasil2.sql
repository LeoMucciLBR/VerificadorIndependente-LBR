-- =====================================================
-- SCRIPT PARA ADICIONAR BR-163 AO VIABRASIL 2
-- =====================================================
-- ATENÇÃO: REVISE ANTES DE EXECUTAR!
-- =====================================================

-- 1. VERIFICAR se o projeto viabrasil2 existe
SELECT id, codigo, nome, slug FROM projects WHERE slug = 'viabrasil2';
-- Anote o ID do projeto (vamos usar @project_id)

-- 2. INSERIR a rodovia BR-163
INSERT INTO rodovias (
    uuid,
    nome,
    codigo,
    concessionaria,
    extensao,
    project_id,
    createdAt,
    updatedAt
) VALUES (
    UUID(),                          -- gera UUID automaticamente
    'BR-163',                        -- nome da rodovia
    'BR-163',                        -- código
    'Concessionária ViaBrasil 2',   -- ajuste conforme necessário
    0.000,                           -- extensão (será calculada depois)
    (SELECT id FROM projects WHERE slug = 'viabrasil2' LIMIT 1), -- project_id
    NOW(),
    NOW()
);

-- 3. VERIFICAR ID da rodovia criada
SELECT id, uuid, nome, codigo, project_id FROM rodovias WHERE nome = 'BR-163';
-- Anote o ID da rodovia (vamos usar @rodovia_id)

-- =====================================================
-- EXEMPLO DE INSERÇÃO DE SEGMENTOS HOMOGÊNEOS
-- =====================================================
-- Substitua os valores conforme seus dados reais
-- IMPORTANTE: Ajuste kmInicial, kmFinal, nome, peso, etc.

/*
INSERT INTO segmentos_homogeneos (
    uuid,
    rodovia_id,
    nome,
    descricao,
    kmInicial,
    kmFinal,
    inicioTrecho,
    fimTrecho,
    peso,
    peso_nota_final,
    geom,
    createdAt,
    updatedAt
) VALUES 
(
    UUID(),
    (SELECT id FROM rodovias WHERE nome = 'BR-163' LIMIT 1),
    'Segmento 1 - BR-163',
    'Trecho inicial da BR-163',
    0.000,
    10.500,
    'Início BR-163',
    'Km 10.5',
    0.100,  -- peso (ajuste conforme necessidade)
    0.00000000,
    ST_GeomFromText('LINESTRING(0 0, 1 1)', 4326), -- ajuste coordenadas
    NOW(),
    NOW()
),
(
    UUID(),
    (SELECT id FROM rodovias WHERE nome = 'BR-163' LIMIT 1),
    'Segmento 2 - BR-163',
    'Segundo trecho da BR-163',
    10.500,
    25.300,
    'Km 10.5',
    'Km 25.3',
    0.150,
    0.00000000,
    ST_GeomFromText('LINESTRING(1 1, 2 2)', 4326),
    NOW(),
    NOW()
);
-- Adicione mais segmentos conforme necessário
*/

-- =====================================================
-- OPÇÃO ALTERNATIVA: IMPORTAR DE KMZ/GEOJSON
-- =====================================================
-- Se você tem um arquivo KMZ/GeoJSON, use a interface em:
-- http://localhost:3000/viabrasil2/geolocalizacao
-- E faça o upload do arquivo lá!

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================
-- Ver quantos segmentos foram criados
SELECT COUNT(*) as total_segmentos 
FROM segmentos_homogeneos 
WHERE rodovia_id = (SELECT id FROM rodovias WHERE nome = 'BR-163' LIMIT 1);

-- Ver todos os segmentos da BR-163
SELECT 
    sh.id,
    sh.nome,
    sh.kmInicial,
    sh.kmFinal,
    r.nome as rodovia,
    p.nome as projeto
FROM segmentos_homogeneos sh
JOIN rodovias r ON sh.rodovia_id = r.id
LEFT JOIN projects p ON r.project_id = p.id
WHERE r.nome = 'BR-163'
ORDER BY sh.kmInicial;
