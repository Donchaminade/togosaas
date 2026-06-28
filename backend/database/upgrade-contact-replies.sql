-- =====================================================================
--  TogoSaaS - Mise a jour : Reponses inline aux messages de contact
-- =====================================================================
--  A IMPORTER UNE FOIS dans phpMyAdmin sur la base de production.
--
--  GARANTIES :
--    - 100% ADDITIF et NON DESTRUCTIF.
--    - Aucune commande DROP / TRUNCATE / ALTER ... DROP.
--    - Aucune table existante n'est modifiee ni recreee.
--    - contact_messages reste INTACTE (aucune colonne ajoutee).
--    - Uniquement un CREATE TABLE IF NOT EXISTS => REEXECUTABLE sans erreur
--      ni perte de donnees (si la table existe deja, elle est ignoree).
--
--  Correspond a la migration additive 026.
-- =====================================================================

CREATE TABLE IF NOT EXISTS contact_replies (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    contact_message_id BIGINT UNSIGNED NOT NULL,
    admin_id           BIGINT UNSIGNED NULL,
    body               TEXT NOT NULL,
    email_status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_contact_replies_msg (contact_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
