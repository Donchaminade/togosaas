-- Edition et suppression des messages support
ALTER TABLE support_messages
    ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL AFTER created_at,
    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
