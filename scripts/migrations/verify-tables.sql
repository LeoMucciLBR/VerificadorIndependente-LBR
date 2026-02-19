-- Verifique se as tabelas grupos e indicadores existem e têm dados
SELECT 'TABELA GRUPOS' as info, COUNT(*) as total FROM grupos;
SELECT 'TABELA INDICADORES' as info, COUNT(*) as total FROM indicadores;

-- Ver estrutura das tabelas
SHOW COLUMNS FROM grupos;
SHOW COLUMNS FROM indicadores;

-- Ver alguns registros
SELECT * FROM grupos LIMIT 3;
SELECT * FROM indicadores LIMIT 3;
