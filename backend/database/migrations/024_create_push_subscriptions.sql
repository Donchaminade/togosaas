-- =====================================================================
--  024 - Abonnements aux notifications Web Push (VAPID)
-- =====================================================================
--  100% ADDITIF et NON DESTRUCTIF : uniquement CREATE TABLE IF NOT EXISTS.
--  Reexecutable sans erreur ni perte de donnees.
-- =====================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NULL,
    endpoint      TEXT NOT NULL,
    endpoint_hash CHAR(64) NOT NULL,
    p256dh        VARCHAR(255) NOT NULL,
    auth          VARCHAR(255) NOT NULL,
    user_agent    VARCHAR(255) NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_push_endpoint (endpoint_hash),
    KEY idx_push_user (user_id),
    CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
