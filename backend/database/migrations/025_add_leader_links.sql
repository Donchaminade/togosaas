-- =====================================================================
--  025 - Liens sociaux du fondateur (colonne additive `leader_links`)
-- =====================================================================
--  100% ADDITIF & NON DESTRUCTIF.
--  - Aucune commande DROP / TRUNCATE / ALTER ... DROP.
--  - Ajout IDEMPOTENT : la colonne n'est créée que si elle n'existe pas
--    encore (test sur information_schema.COLUMNS). Réexécutable sans erreur.
--  - Les données et comptes existants restent intacts.
-- =====================================================================

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'communities'
      AND COLUMN_NAME = 'leader_links'
);

SET @ddl := IF(
    @col_exists = 0,
    'ALTER TABLE communities ADD COLUMN leader_links TEXT NULL COMMENT ''Liens sociaux du fondateur (JSON: linkedin, facebook, github, portfolio, email)'' AFTER leader_bio',
    'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Enregistre la migration (ignore si déjà présente).
INSERT IGNORE INTO migrations (migration) VALUES ('025_add_leader_links.sql');
