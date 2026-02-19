-- =====================================================
-- SCRIPT PARA ASSOCIAR RODOVIAS AOS PROJETOS
-- =====================================================
-- ATENÇÃO: NÃO EXECUTE SEM REVISAR E TER CERTEZA!
-- =====================================================

-- 1. Ver quais projetos existem
SELECT id, codigo, nome, slug FROM projects;

-- 2. Ver quais rodovias existem e seus project_id atuais
SELECT id, nome, codigo, project_id FROM rodovias ORDER BY nome;

-- 3. Ver quantas rodovias estão SEM projeto associado
SELECT COUNT(*) as rodovias_sem_projeto 
FROM rodovias 
WHERE project_id IS NULL;

-- =====================================================
-- COMANDOS DE ATUALIZAÇÃO (NÃO EXECUTE SEM PERMISSÃO!)
-- =====================================================

-- EXEMPLO: Associar TODAS as rodovias ao projeto "viabrasil1"
-- Substitua o ID do projeto conforme necessário
/*
UPDATE rodovias 
SET project_id = (SELECT id FROM projects WHERE slug = 'viabrasil1' LIMIT 1)
WHERE project_id IS NULL;
*/

-- OU: Associar rodovias ESPECÍFICAS por nome/código
/*
-- Para ViaBrasil 1
UPDATE rodovias 
SET project_id = (SELECT id FROM projects WHERE slug = 'viabrasil1' LIMIT 1)
WHERE nome LIKE '%BR-163%' OR codigo LIKE '%BR-163%';

-- Para ViaBrasil 2  
UPDATE rodovias 
SET project_id = (SELECT id FROM projects WHERE slug = 'viabrasil2' LIMIT 1)
WHERE nome LIKE '%BR-364%' OR codigo LIKE '%BR-364%';
*/

-- 4. VERIFICAR após atualização
-- SELECT id, nome, codigo, project_id FROM rodovias ORDER BY project_id, nome;

-- =====================================================
-- IMPORTANTE:
-- - Segmentos NÃO precisam de project_id porque herdam da rodovia
-- - A query já filtra: WHERE rodovias.project_id = X
-- - Certifique-se de que cada rodovia está no projeto correto!
-- =====================================================
