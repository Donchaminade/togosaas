-- Pièces jointes sur les messages support lead <-> admin
ALTER TABLE support_messages
    ADD COLUMN attachments JSON NULL AFTER body;
