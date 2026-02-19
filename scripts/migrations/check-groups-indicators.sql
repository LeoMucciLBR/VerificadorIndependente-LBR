-- Verificar se a tabela grupos existe e tem dados
SELECT 'GRUPOS' as tabela, COUNT(*) as total FROM grupos;

-- Ver alguns registros de grupos
SELECT * FROM grupos LIMIT 5;

-- Verificar se a tabela indicadores existe e tem dados  
SELECT 'INDICADORES' as tabela, COUNT(*) as total FROM indicadores;

-- Ver alguns registros de indicadores
SELECT * FROM indicadores LIMIT 5;

-- Verificar estrutura da tabela grupos
DESCRIBE grupos;

-- Verificar estrutura da tabela indicadores
DESCRIBE indicadores;
