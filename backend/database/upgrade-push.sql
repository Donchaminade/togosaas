-- =====================================================================
--  TogoSaaS - Mise a jour : Notifications Web Push (PWA / VAPID)
-- =====================================================================
--  A IMPORTER UNE FOIS dans phpMyAdmin sur la base de production.
--
--  GARANTIES :
--    - 100% ADDITIF et NON DESTRUCTIF.
--    - Aucune commande DROP / TRUNCATE / ALTER ... DROP.
--    - Aucune table existante n'est modifiee ni recreee.
--    - Uniquement un CREATE TABLE IF NOT EXISTS => REEXECUTABLE sans erreur
--      ni perte de donnees (si la table existe deja, elle est ignoree).
--    - Les comptes, solutions, avis et messages existants restent intacts.
--
--  Correspond a la migration additive 024.
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
