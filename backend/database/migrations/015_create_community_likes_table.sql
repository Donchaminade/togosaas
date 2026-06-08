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
