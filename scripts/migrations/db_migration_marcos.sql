CREATE TABLE `marcos_quilometricos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rodovia_id` bigint NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `km` decimal(10,3) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `geoJson` json DEFAULT NULL,
  `createdAt` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updatedAt` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `ix_marcos_rodovia` (`rodovia_id`),
  KEY `ix_marcos_km` (`km`),
  CONSTRAINT `fk_marcos_rodovia` FOREIGN KEY (`rodovia_id`) REFERENCES `rodovias` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
