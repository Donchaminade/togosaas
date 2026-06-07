-- Profil fondateur / auteur (page A propos) — une seule ligne
CREATE TABLE IF NOT EXISTS site_author (
    id           TINYINT UNSIGNED NOT NULL DEFAULT 1,
    name         VARCHAR(160) NOT NULL,
    role_label   VARCHAR(160) NOT NULL,
    badge_label  VARCHAR(120) NOT NULL DEFAULT 'Fondateur & Auteur',
    quote        TEXT NOT NULL,
    bio          TEXT NOT NULL,
    photo_url    VARCHAR(500) NULL,
    linkedin_url VARCHAR(500) NULL,
    github_url   VARCHAR(500) NULL,
    twitter_url  VARCHAR(500) NULL,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_author (id, name, role_label, badge_label, quote, bio)
VALUES (
    1,
    'Chaminade Dondah Adjolou',
    'Initiateur du projet TCH',
    'Fondateur & Auteur',
    'TCH est une idée que je porte avec conviction : offrir aux communautés togolaises l''espace qu''elles méritent pour exister, se faire connaître et grandir. Chaque communauté est une graine ; ce hub est le terreau qui les aide à s''épanouir et à se rencontrer.',
    'Passionné par la tech et l''impact social, Chaminade conçoit TCH comme un bien commun au service de l''écosystème togolais.'
) ON DUPLICATE KEY UPDATE id = id;
