-- ============================================================
-- TogoSaaS - Installation complete du schema (genere automatiquement)
-- Import UNIQUE via phpMyAdmin (onglet Importer).
-- Contient les migrations 001..021 dans l'ordre + table de suivi 'migrations'.
-- NE CONTIENT AUCUN SECRET. Le compte admin s'insere separement.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS migrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    migration VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_migration (migration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 001_create_users_table.sql
-- ------------------------------------------------------------
-- Table des utilisateurs (leads + administrateurs)
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(40)  NULL,
    role          ENUM('lead', 'admin') NOT NULL DEFAULT 'lead',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 002_create_communities_table.sql
-- ------------------------------------------------------------
-- Table des communautes soumises par les leads
CREATE TABLE IF NOT EXISTS communities (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      BIGINT UNSIGNED NULL,
    name         VARCHAR(160) NOT NULL,
    description  TEXT NOT NULL,
    neighborhood VARCHAR(120) NOT NULL,
    tags         JSON NULL,
    logo_url     VARCHAR(500) NULL,
    whatsapp_url VARCHAR(500) NULL,
    telegram_url VARCHAR(500) NULL,
    linkedin_url VARCHAR(500) NULL,
    twitter_url  VARCHAR(500) NULL,
    website_url  VARCHAR(500) NULL,
    lat          DECIMAL(10, 7) NULL,
    lng          DECIMAL(10, 7) NULL,
    leader_name  VARCHAR(160) NOT NULL,
    leader_email VARCHAR(160) NOT NULL,
    leader_phone VARCHAR(40)  NULL,
    status       ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_communities_status (status),
    KEY idx_communities_user (user_id),
    KEY idx_communities_neighborhood (neighborhood),
    CONSTRAINT fk_communities_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 003_create_contact_messages_table.sql
-- ------------------------------------------------------------
-- Table des messages envoyes via le formulaire de contact
CREATE TABLE IF NOT EXISTS contact_messages (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(160) NOT NULL,
    subject    VARCHAR(200) NULL,
    message    TEXT NOT NULL,
    is_read    TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_messages_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 004_add_community_detail_fields.sql
-- ------------------------------------------------------------
-- Champs enrichis pour les pages de detail des communautes
ALTER TABLE communities
    ADD COLUMN banner_url       VARCHAR(500) NULL AFTER logo_url,
    ADD COLUMN short_description VARCHAR(300) NULL AFTER description,
    ADD COLUMN mission          TEXT NULL AFTER short_description,
    ADD COLUMN leader_photo_url VARCHAR(500) NULL AFTER leader_phone,
    ADD COLUMN leader_bio       TEXT NULL AFTER leader_photo_url,
    ADD COLUMN co_leads         JSON NULL AFTER leader_bio,
    ADD COLUMN gallery          JSON NULL AFTER co_leads,
    ADD COLUMN founded_year     SMALLINT UNSIGNED NULL AFTER gallery,
    ADD COLUMN member_count     INT UNSIGNED NULL AFTER founded_year,
    ADD COLUMN meeting_info     TEXT NULL AFTER member_count,
    ADD COLUMN public_email     VARCHAR(160) NULL AFTER meeting_info;

-- ------------------------------------------------------------
-- 005_replace_neighborhood_with_country_city.sql
-- ------------------------------------------------------------
-- Remplacer neighborhood par country (obligatoire) + city (facultatif)
ALTER TABLE communities
    ADD COLUMN country VARCHAR(120) NOT NULL DEFAULT 'Togo' AFTER mission,
    ADD COLUMN city VARCHAR(120) NULL AFTER country;

UPDATE communities
SET city = neighborhood,
    country = 'Togo'
WHERE neighborhood IS NOT NULL AND neighborhood != '';

ALTER TABLE communities
    DROP INDEX idx_communities_neighborhood,
    DROP COLUMN neighborhood,
    ADD KEY idx_communities_country (country);

-- ------------------------------------------------------------
-- 006_create_community_events_table.sql
-- ------------------------------------------------------------
-- Evenements du calendrier communautaire (geres par les leads)
CREATE TABLE IF NOT EXISTS community_events (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    community_id BIGINT UNSIGNED NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT NULL,
    starts_at    DATETIME NOT NULL,
    ends_at      DATETIME NULL,
    location     VARCHAR(255) NULL,
    event_url    VARCHAR(500) NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_community_events_community (community_id),
    KEY idx_community_events_starts (starts_at),
    CONSTRAINT fk_community_events_community FOREIGN KEY (community_id)
        REFERENCES communities (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 007_create_community_members_table.sql
-- ------------------------------------------------------------
-- Acces co-leads : liaison utilisateur <-> communaute
CREATE TABLE IF NOT EXISTS community_members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    community_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('owner', 'co_lead') NOT NULL DEFAULT 'co_lead',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_community_user (community_id, user_id),
    KEY idx_user (user_id),
    CONSTRAINT fk_cm_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 008_create_support_messages_table.sql
-- ------------------------------------------------------------
-- Messages de support lead <-> admin
CREATE TABLE IF NOT EXISTS support_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    sender_role ENUM('lead', 'admin') NOT NULL,
    body TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_support_user (user_id),
    KEY idx_support_read (is_read),
    CONSTRAINT fk_support_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 009_create_site_author_table.sql
-- ------------------------------------------------------------
-- Profil fondateur / auteur (page A propos) — une seule ligne
CREATE TABLE IF NOT EXISTS site_author (
    id           TINYINT UNSIGNED NOT NULL DEFAULT 1,
    name         VARCHAR(160) NOT NULL,
    role_label   VARCHAR(160) NOT NULL,
    badge_label  VARCHAR(120) NOT NULL DEFAULT 'Fondateur & Auteur',
    quote        TEXT NOT NULL,
    bio          TEXT NOT NULL,
    photo_url    VARCHAR(500) NULL,
    linkedin_url VARCHAR(500) NULL,
    github_url   VARCHAR(500) NULL,
    twitter_url  VARCHAR(500) NULL,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_author (id, name, role_label, badge_label, quote, bio)
VALUES (
    1,
    'Chaminade Dondah Adjolou',
    'Initiateur du projet Togosaas',
    'Fondateur & Auteur',
    'Togosaas est une idée que je porte avec conviction : offrir aux solutions SaaS togolaises l''espace qu''elles méritent pour exister, se faire connaître et grandir. Chaque solution est une graine ; ce hub est le terreau qui les aide à s''épanouir et à se rencontrer.',
    'Passionné par l''impact numérique local, Chaminade conçoit Togosaas comme un bien commun au service de l''écosystème SaaS togolais.'
) ON DUPLICATE KEY UPDATE id = id;

-- ------------------------------------------------------------
-- 010_create_community_reports_table.sql
-- ------------------------------------------------------------
-- Signalements anonymes contre communautés / leads (modération admin)
CREATE TABLE IF NOT EXISTS community_reports (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    community_id  BIGINT UNSIGNED NOT NULL,
    target_type   ENUM('community', 'lead') NOT NULL DEFAULT 'community',
    category      VARCHAR(64) NOT NULL,
    description   TEXT NOT NULL,
    evidence      JSON NULL,
    tracking_code VARCHAR(32) NOT NULL,
    status        ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    admin_notes   TEXT NULL,
    admin_action  TEXT NULL,
    reviewed_at   DATETIME NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tracking_code (tracking_code),
    INDEX idx_status (status),
    INDEX idx_community (community_id),
    CONSTRAINT fk_reports_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 011_add_support_message_attachments.sql
-- ------------------------------------------------------------
-- Pièces jointes sur les messages support lead <-> admin
ALTER TABLE support_messages
    ADD COLUMN attachments JSON NULL AFTER body;

-- ------------------------------------------------------------
-- 012_add_user_avatar_url.sql
-- ------------------------------------------------------------
-- Photo de profil optionnelle pour les utilisateurs (leads)
ALTER TABLE users
    ADD COLUMN avatar_url VARCHAR(500) NULL AFTER phone;

-- ------------------------------------------------------------
-- 013_add_community_slug.sql
-- ------------------------------------------------------------
-- Slug URL-friendly pour les fiches communautés publiques
ALTER TABLE communities
    ADD COLUMN slug VARCHAR(160) NULL AFTER name,
    ADD UNIQUE KEY uq_communities_slug (slug);

-- ------------------------------------------------------------
-- 014_support_message_edit_delete.sql
-- ------------------------------------------------------------
-- Edition et suppression des messages support
ALTER TABLE support_messages
    ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

-- ------------------------------------------------------------
-- 015_create_community_likes_table.sql
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_likes (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    community_id BIGINT UNSIGNED NOT NULL,
    visitor_id   VARCHAR(64) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_community_like_visitor (community_id, visitor_id),
    KEY idx_community_likes_community (community_id),
    CONSTRAINT fk_community_likes_community FOREIGN KEY (community_id)
        REFERENCES communities (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 016_create_community_reviews_table.sql
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_reviews (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    community_id BIGINT UNSIGNED NOT NULL,
    visitor_id   VARCHAR(64) NOT NULL,
    rating       TINYINT UNSIGNED NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_community_review_visitor (community_id, visitor_id),
    KEY idx_community_reviews_community (community_id),
    CONSTRAINT fk_community_reviews_community FOREIGN KEY (community_id)
        REFERENCES communities (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_community_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 017_add_event_poster_url.sql
-- ------------------------------------------------------------
ALTER TABLE community_events
    ADD COLUMN poster_url VARCHAR(500) NULL AFTER description;

-- ------------------------------------------------------------
-- 018_add_saas_pricing_fields.sql
-- ------------------------------------------------------------
-- Champs marketplace SaaS pour les solutions (table communities)
ALTER TABLE communities
  ADD COLUMN pricing_type ENUM('free', 'freemium', 'paid') NOT NULL DEFAULT 'free' AFTER status,
  ADD COLUMN price_amount DECIMAL(12, 2) NULL AFTER pricing_type,
  ADD COLUMN currency VARCHAR(8) NOT NULL DEFAULT 'XOF' AFTER price_amount,
  ADD COLUMN billing_period ENUM('monthly', 'yearly', 'one_time') NULL AFTER currency,
  ADD COLUMN app_url VARCHAR(500) NULL COMMENT 'Lien direct vers la solution' AFTER website_url,
  ADD COLUMN demo_url VARCHAR(500) NULL COMMENT 'Lien démo ou essai gratuit' AFTER app_url;

CREATE INDEX idx_communities_pricing_type ON communities (pricing_type);

-- ------------------------------------------------------------
-- 019_add_subadmin_role.sql
-- ------------------------------------------------------------
-- Ajoute le role "subadmin" (gestionnaire aux droits limites) a l'ENUM des roles.
-- Un subadmin accede a l'espace admin pour la moderation courante mais ne peut pas
-- gerer les comptes du staff, editer la page A propos, ni supprimer definitivement.
ALTER TABLE users
    MODIFY COLUMN role ENUM('lead', 'admin', 'subadmin') NOT NULL DEFAULT 'lead';

-- ------------------------------------------------------------
-- 020_create_email_campaigns.sql
-- ------------------------------------------------------------
-- Campagnes email envoyees par l'admin aux leads (+ suivi par destinataire)
CREATE TABLE IF NOT EXISTS email_campaigns (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject          VARCHAR(255) NOT NULL,
    body_html        MEDIUMTEXT NOT NULL,
    attachments      JSON NULL,
    sender_id        BIGINT UNSIGNED NULL,
    recipients_count INT UNSIGNED NOT NULL DEFAULT 0,
    sent_count       INT UNSIGNED NOT NULL DEFAULT 0,
    failed_count     INT UNSIGNED NOT NULL DEFAULT 0,
    status           ENUM('draft', 'sending', 'sent', 'partial', 'failed') NOT NULL DEFAULT 'draft',
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_email_campaigns_created (created_at),
    CONSTRAINT fk_email_campaigns_sender FOREIGN KEY (sender_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    campaign_id BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NULL,
    email       VARCHAR(160) NOT NULL,
    name        VARCHAR(120) NULL,
    status      ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    error       VARCHAR(500) NULL,
    sent_at     TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_ecr_campaign (campaign_id),
    KEY idx_ecr_status (status),
    CONSTRAINT fk_ecr_campaign FOREIGN KEY (campaign_id)
        REFERENCES email_campaigns (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ecr_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 021_create_automations.sql
-- ------------------------------------------------------------
-- Module d'automatisation : modeles de message, automatisations (declencheur ->
-- modele) et journal d'execution.

CREATE TABLE IF NOT EXISTS message_templates (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(160) NOT NULL,
    subject     VARCHAR(255) NOT NULL,
    body_html   MEDIUMTEXT NOT NULL,
    description VARCHAR(500) NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automations (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name              VARCHAR(160) NOT NULL,
    trigger_event     ENUM(
        'lead_register',
        'community_submitted',
        'community_approved',
        'community_rejected',
        'report_status_changed',
        'scheduled',
        'manual'
    ) NOT NULL,
    template_id       BIGINT UNSIGNED NULL,
    is_active         TINYINT(1) NOT NULL DEFAULT 1,
    audience          ENUM('event', 'all_leads', 'selection') NOT NULL DEFAULT 'event',
    audience_user_ids JSON NULL,
    schedule_config   JSON NULL,
    last_run_at       TIMESTAMP NULL DEFAULT NULL,
    next_run_at       DATETIME NULL DEFAULT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_automations_trigger (trigger_event, is_active),
    KEY idx_automations_next_run (next_run_at),
    CONSTRAINT fk_automations_template FOREIGN KEY (template_id)
        REFERENCES message_templates (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    automation_id   BIGINT UNSIGNED NULL,
    trigger_event   VARCHAR(40) NOT NULL,
    recipient_email VARCHAR(190) NOT NULL,
    recipient_name  VARCHAR(160) NULL,
    user_id         BIGINT UNSIGNED NULL,
    subject         VARCHAR(255) NULL,
    status          ENUM('pending', 'sending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
    error           VARCHAR(500) NULL,
    context         JSON NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at         TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_automation_logs_status (status),
    KEY idx_automation_logs_automation (automation_id),
    KEY idx_automation_logs_created (created_at),
    CONSTRAINT fk_automation_logs_automation FOREIGN KEY (automation_id)
        REFERENCES automations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_automation_logs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Marquer ces migrations comme appliquees (pour un futur migrate.php)
INSERT IGNORE INTO migrations (migration) VALUES ('001_create_users_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('002_create_communities_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('003_create_contact_messages_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('004_add_community_detail_fields.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('005_replace_neighborhood_with_country_city.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('006_create_community_events_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('007_create_community_members_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('008_create_support_messages_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('009_create_site_author_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('010_create_community_reports_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('011_add_support_message_attachments.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('012_add_user_avatar_url.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('013_add_community_slug.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('014_support_message_edit_delete.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('015_create_community_likes_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('016_create_community_reviews_table.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('017_add_event_poster_url.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('018_add_saas_pricing_fields.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('019_add_subadmin_role.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('020_create_email_campaigns.sql');
INSERT IGNORE INTO migrations (migration) VALUES ('021_create_automations.sql');
