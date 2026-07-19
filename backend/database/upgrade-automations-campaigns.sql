-- =====================================================================
--  TogoSaaS - Extension campagnes email (15 automatisations)
-- =====================================================================
--  À IMPORTER dans phpMyAdmin (base de prod), AVANT le seed
--  seed-automations-campaigns.sql.
--
--  GARANTIES :
--    - 100% ADDITIF et NON DESTRUCTIF.
--    - Aucune commande DROP / TRUNCATE / ALTER ... DROP.
--    - ENUM étendus (ajout de valeurs uniquement) de façon idempotente.
--    - Index optionnel sur automation_logs (anti-spam / dédup).
--    - Réexécutable sans perte de données.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- trigger_event : nouveaux événements (review, seuil note, signalement)
-- ---------------------------------------------------------------------
SET @need_trigger := (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'automations'
      AND COLUMN_NAME = 'trigger_event'
      AND COLUMN_TYPE LIKE '%review_created%'
);

SET @ddl_trigger := IF(
    @need_trigger = 1,
    "ALTER TABLE automations MODIFY COLUMN trigger_event ENUM(
        'lead_register',
        'community_submitted',
        'community_approved',
        'community_rejected',
        'report_status_changed',
        'review_created',
        'rating_threshold',
        'report_filed',
        'scheduled',
        'manual'
    ) NOT NULL",
    'SELECT 1'
);

PREPARE stmt_trigger FROM @ddl_trigger;
EXECUTE stmt_trigger;
DEALLOCATE PREPARE stmt_trigger;

-- ---------------------------------------------------------------------
-- audience : audiences ciblées pour campagnes planifiées / manuelles
-- ---------------------------------------------------------------------
SET @need_audience := (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'automations'
      AND COLUMN_NAME = 'audience'
      AND COLUMN_TYPE LIKE '%leads_no_solution%'
);

SET @ddl_audience := IF(
    @need_audience = 1,
    "ALTER TABLE automations MODIFY COLUMN audience ENUM(
        'event',
        'all_leads',
        'selection',
        'leads_no_solution',
        'leads_inactive',
        'leads_incomplete_profile',
        'leads_pending_review',
        'leads_with_solution',
        'leads_dormant_solution',
        'leads_stale_profile',
        'leads_onboarding_d3',
        'leads_onboarding_d7',
        'leads_recently_approved',
        'admins',
        'category_tag'
    ) NOT NULL DEFAULT 'event'",
    'SELECT 1'
);

PREPARE stmt_audience FROM @ddl_audience;
EXECUTE stmt_audience;
DEALLOCATE PREPARE stmt_audience;

-- ---------------------------------------------------------------------
-- Index anti-spam (automation + user + date) — ADDITIF
-- ---------------------------------------------------------------------
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'automation_logs'
      AND INDEX_NAME = 'idx_automation_logs_dedup'
);

SET @ddl_idx := IF(
    @idx_exists = 0,
    'ALTER TABLE automation_logs ADD KEY idx_automation_logs_dedup (automation_id, user_id, created_at)',
    'SELECT 1'
);

PREPARE stmt_idx FROM @ddl_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
