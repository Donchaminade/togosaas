-- Avis ecrits + moderation (100% additif, aucune table existante alteree).
-- On NE modifie PAS community_reviews (qui ne stocke que la note + visitor_id).
-- Les commentaires, reponses editeur et signalements vivent dans de NOUVELLES
-- tables liees par review_id. Tout en CREATE TABLE IF NOT EXISTS : reexecutable.

-- Contenu redige d'un avis (titre + texte), lie 1:1 a une note existante.
CREATE TABLE IF NOT EXISTS community_review_contents (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id    BIGINT UNSIGNED NOT NULL,
    community_id BIGINT UNSIGNED NOT NULL,
    visitor_id   VARCHAR(64) NOT NULL,
    title        VARCHAR(160) NULL,
    comment      TEXT NOT NULL,
    author_name  VARCHAR(120) NULL,
    status       ENUM('visible', 'hidden') NOT NULL DEFAULT 'visible',
    flags_count  INT UNSIGNED NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_content (review_id),
    KEY idx_review_contents_community (community_id, status),
    CONSTRAINT fk_review_contents_review FOREIGN KEY (review_id)
        REFERENCES community_reviews (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_contents_community FOREIGN KEY (community_id)
        REFERENCES communities (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reponse de l'editeur (proprietaire de la solution) a un avis.
CREATE TABLE IF NOT EXISTS community_review_replies (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id    BIGINT UNSIGNED NOT NULL,
    community_id BIGINT UNSIGNED NOT NULL,
    user_id      BIGINT UNSIGNED NULL,
    body         TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_reply (review_id),
    KEY idx_review_replies_community (community_id),
    CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id)
        REFERENCES community_reviews (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_replies_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Signalements d'avis par les visiteurs (moderation), un seul par visiteur.
CREATE TABLE IF NOT EXISTS community_review_flags (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id  BIGINT UNSIGNED NOT NULL,
    visitor_id VARCHAR(64) NOT NULL,
    reason     VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_flag (review_id, visitor_id),
    KEY idx_review_flags_review (review_id),
    CONSTRAINT fk_review_flags_review FOREIGN KEY (review_id)
        REFERENCES community_reviews (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
