-- Remplacer neighborhood par country (obligatoire) + city (facultatif)
ALTER TABLE communities
    ADD COLUMN country VARCHAR(120) NOT NULL DEFAULT 'Togo' AFTER mission,
    ADD COLUMN city VARCHAR(120) NULL AFTER country;

UPDATE communities
SET city = neighborhood,
    country = 'Togo'
WHERE neighborhood IS NOT NULL AND neighborhood != '';

ALTER TABLE communities
    DROP INDEX idx_communities_neighborhood,
    DROP COLUMN neighborhood,
    ADD KEY idx_communities_country (country);
