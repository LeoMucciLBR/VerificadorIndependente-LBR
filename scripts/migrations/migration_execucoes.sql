-- Adicionar colunas na tabela inspecoes
ALTER TABLE `inspecoes` 
ADD COLUMN `fase_id` BIGINT NULL,
ADD COLUMN `is_official` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Pendente',
ADD COLUMN `nota` DECIMAL(5, 2) NULL;

-- Criar índice para a coluna fase_id
CREATE INDEX `ix_inspecoes_fase` ON `inspecoes`(`fase_id`);

-- Adicionar chave estrangeira para a tabela fases
-- Nota: Certifique-se de que a tabela 'fases' e a coluna 'id' existem e são compatíveis (BigInt/Unsigned se aplicável).
-- O padrão do projeto parece ser ON UPDATE RESTRICT e ON DELETE RESTRICT (ou CASCADE dependendo do caso).
-- Como fase_id é opcional (NULL), ON DELETE SET NULL seria uma opção, mas seguiremos o RESTRICT para consistência se preferir.
ALTER TABLE `inspecoes`
ADD CONSTRAINT `fk_inspecoes_fase` 
FOREIGN KEY (`fase_id`) REFERENCES `fases`(`id`) 
ON DELETE RESTRICT ON UPDATE RESTRICT;
