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
