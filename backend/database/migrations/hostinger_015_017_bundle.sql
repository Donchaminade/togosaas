-- Migrations TogoSaaS 015 → 017 (likes, avis, affiche événement)
-- À exécuter dans phpMyAdmin sur la base u878418868_tchdb

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

-- Ignorer l'erreur si la colonne existe déjà
ALTER TABLE community_events
    ADD COLUMN poster_url VARCHAR(500) NULL AFTER description;

INSERT IGNORE INTO migrations (migration) VALUES
    ('015_create_community_likes_table.sql'),
    ('016_create_community_reviews_table.sql'),
    ('017_add_event_poster_url.sql');
