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
