-- Champs enrichis pour les pages de detail des communautes
ALTER TABLE communities
    ADD COLUMN banner_url       VARCHAR(500) NULL AFTER logo_url,
    ADD COLUMN short_description VARCHAR(300) NULL AFTER description,
    ADD COLUMN mission          TEXT NULL AFTER short_description,
    ADD COLUMN leader_photo_url VARCHAR(500) NULL AFTER leader_phone,
    ADD COLUMN leader_bio       TEXT NULL AFTER leader_photo_url,
    ADD COLUMN co_leads         JSON NULL AFTER leader_bio,
    ADD COLUMN gallery          JSON NULL AFTER co_leads,
    ADD COLUMN founded_year     SMALLINT UNSIGNED NULL AFTER gallery,
    ADD COLUMN member_count     INT UNSIGNED NULL AFTER founded_year,
    ADD COLUMN meeting_info     TEXT NULL AFTER member_count,
    ADD COLUMN public_email     VARCHAR(160) NULL AFTER meeting_info;
