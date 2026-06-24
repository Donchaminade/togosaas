-- Ajoute le role "subadmin" (gestionnaire aux droits limites) a l'ENUM des roles.
-- Un subadmin accede a l'espace admin pour la moderation courante mais ne peut pas
-- gerer les comptes du staff, editer la page A propos, ni supprimer definitivement.
ALTER TABLE users
    MODIFY COLUMN role ENUM('lead', 'admin', 'subadmin') NOT NULL DEFAULT 'lead';
