-- =====================================================================
--  026 - Reponses admin aux messages du formulaire de contact
-- =====================================================================
--  100% ADDITIF et NON DESTRUCTIF : uniquement CREATE TABLE IF NOT EXISTS.
--  Reexecutable sans erreur ni perte de donnees.
--
--  Stocke le fil de reponses d'un message de contact (visiteur sans compte).
--  Le statut "repondu" d'un message est DEDUIT (>= 1 reponse) :
--  aucune colonne n'est ajoutee a contact_messages.
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
