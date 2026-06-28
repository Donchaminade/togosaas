-- =====================================================================
--  TogoSaaS - Mise a jour fonctionnalites (avis ecrits + confirmation email)
-- =====================================================================
--  A IMPORTER UNE FOIS dans phpMyAdmin sur la base de production.
--
--  GARANTIES :
--    - 100% ADDITIF et NON DESTRUCTIF.
--    - Aucune commande DROP / TRUNCATE / ALTER ... DROP.
--    - Aucune table existante n'est modifiee ni recreee.
--    - Uniquement des CREATE TABLE IF NOT EXISTS => REEXECUTABLE sans erreur
--      ni perte de donnees (les tables deja presentes sont ignorees).
--    - Les comptes et avis existants restent intacts.
--
--  Regroupe les migrations additives 022 et 023.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 022 - Avis ecrits + moderation
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community_review_contents (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id    BIGINT UNSIGNED NOT NULL,
    community_id BIGINT UNSIGNED NOT NULL,
    visitor_id   VARCHAR(64) NOT NULL,
    title        VARCHAR(160) NULL,
    comment      TEXT NOT NULL,
    author_name  VARCHAR(120) NULL,
    status       ENUM('visible', 'hidden') NOT NULL DEFAULT 'visible',
    flags_count  INT UNSIGNED NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_content (review_id),
    KEY idx_review_contents_community (community_id, status),
    CONSTRAINT fk_review_contents_review FOREIGN KEY (review_id)
        REFERENCES community_reviews (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_contents_community FOREIGN KEY (community_id)
        REFERENCES communities (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_review_replies (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id    BIGINT UNSIGNED NOT NULL,
    community_id BIGINT UNSIGNED NOT NULL,
    user_id      BIGINT UNSIGNED NULL,
    body         TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_reply (review_id),
    KEY idx_review_replies_community (community_id),
    CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id)
        REFERENCES community_reviews (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_replies_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_review_flags (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id  BIGINT UNSIGNED NOT NULL,
    visitor_id VARCHAR(64) NOT NULL,
    reason     VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_flag (review_id, visitor_id),
    KEY idx_review_flags_review (review_id),
    CONSTRAINT fk_review_flags_review FOREIGN KEY (review_id)
        REFERENCES community_reviews (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 023 - Confirmation d'email a l'inscription
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_verifications (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED NOT NULL,
    token       VARCHAR(64) NOT NULL,
    expires_at  DATETIME NOT NULL,
    consumed_at DATETIME NULL DEFAULT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_email_verification_token (token),
    KEY idx_email_verifications_user (user_id),
    KEY idx_email_verifications_consumed (user_id, consumed_at),
    CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
