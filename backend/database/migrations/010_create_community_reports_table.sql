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
