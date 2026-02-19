-- ============================================================================
-- Migration: Add KMZ and GeoJSON fields for multi-level trace management
-- Date: 2026-01-28
-- Description: Adds fields to support KMZ/GeoJSON storage at project, 
--              rodovia, and segment levels
-- ============================================================================

-- IMPORTANTE: Execute este script manualmente no seu banco de dados MySQL
-- Certifique-se de fazer backup antes de executar!

USE viabrasil2;

-- ============================================================================
-- 1. Adicionar campos na tabela PROJECTS
-- ============================================================================
-- Armazena o traçado completo do projeto

ALTER TABLE `projects` 
  ADD COLUMN `kmzUrl` VARCHAR(1024) NULL COMMENT 'URL do arquivo KMZ original completo',
  ADD COLUMN `geojson` JSON NULL COMMENT 'GeoJSON do traçado completo do projeto';

-- ============================================================================
-- 2. Adicionar campo GeoJSON na tabela RODOVIAS
-- ============================================================================
-- A tabela já tem kmlUrl e shpUrl, vamos adicionar geojson para performance

ALTER TABLE `rodovias` 
  ADD COLUMN `geojson` JSON NULL COMMENT 'GeoJSON do traçado da rodovia';

-- ============================================================================
-- 3. Adicionar campos na tabela SEGMENTOS_HOMOGENEOS
-- ============================================================================
-- Armazena o traçado recortado de cada segmento

ALTER TABLE `segmentos_homogeneos` 
  ADD COLUMN `kmzUrl` VARCHAR(1024) NULL COMMENT 'URL do KMZ recortado do segmento',
  ADD COLUMN `geojson` JSON NULL COMMENT 'GeoJSON do traçado recortado do segmento';

-- ============================================================================
-- 4. Criar índices para melhorar performance de queries
-- ============================================================================

-- Não criamos índice em campos JSON diretamente, mas podemos criar 
-- índices funcionais se necessário no futuro

-- ============================================================================
-- 5. Verificar alterações
-- ============================================================================

-- Verificar estrutura da tabela projects
DESCRIBE `projects`;

-- Verificar estrutura da tabela rodovias
DESCRIBE `rodovias`;

-- Verificar estrutura da tabela segmentos_homogeneos
DESCRIBE `segmentos_homogeneos`;

-- ============================================================================
-- ROLLBACK (caso precise reverter)
-- ============================================================================
-- Descomente as linhas abaixo APENAS se precisar reverter as alterações

-- ALTER TABLE `projects` 
--   DROP COLUMN `kmzUrl`,
--   DROP COLUMN `geojson`;

-- ALTER TABLE `rodovias` 
--   DROP COLUMN `geojson`;

-- ALTER TABLE `segmentos_homogeneos` 
--   DROP COLUMN `kmzUrl`,
--   DROP COLUMN `geojson`;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
