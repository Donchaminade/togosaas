-- =====================================================================
--  TogoSaaS - Liens sociaux par membre d'équipe (fondateur + co-membres)
-- =====================================================================
--  À IMPORTER UNE FOIS dans phpMyAdmin sur la base de production.
--
--  GARANTIES :
--    - 100% ADDITIF et NON DESTRUCTIF.
--    - Aucune commande DROP / TRUNCATE / ALTER ... DROP.
--    - Aucune table existante n'est recréée.
--    - Ajout de colonne IDEMPOTENT (test information_schema avant ALTER)
--      => REEXECUTABLE sans erreur ni perte de données.
--    - Les co-membres (facebook / github / portfolio) ne nécessitent
--      AUCUNE migration : ils sont stockés dans le JSON `co_leads` existant.
--    - Seul le FONDATEUR nécessite cette nouvelle colonne `leader_links`.
--    - Les comptes, solutions et données existants restent intacts.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colonne additive `leader_links` (liens sociaux du fondateur)
-- ---------------------------------------------------------------------

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
