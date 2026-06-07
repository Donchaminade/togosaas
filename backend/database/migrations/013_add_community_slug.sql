-- Slug URL-friendly pour les fiches communautés publiques
ALTER TABLE communities
    ADD COLUMN slug VARCHAR(160) NULL AFTER name,
    ADD UNIQUE KEY uq_communities_slug (slug);
