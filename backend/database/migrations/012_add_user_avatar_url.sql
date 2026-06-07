-- Photo de profil optionnelle pour les utilisateurs (leads)
ALTER TABLE users
    ADD COLUMN avatar_url VARCHAR(500) NULL AFTER phone;
