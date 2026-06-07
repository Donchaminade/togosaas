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
