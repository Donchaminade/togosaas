-- Confirmation d'email a l'inscription (100% additif).
-- On NE modifie PAS la table users : la notion de "verifie" est portee par
-- cette nouvelle table. Les comptes existants (sans ligne) restent valides et
-- ne sont jamais bloques. CREATE TABLE IF NOT EXISTS : reexecutable sans perte.
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
