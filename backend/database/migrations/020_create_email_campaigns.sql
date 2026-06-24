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
