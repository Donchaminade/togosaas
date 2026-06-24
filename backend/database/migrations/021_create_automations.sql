-- Module d'automatisation : modeles de message, automatisations (declencheur ->
-- modele) et journal d'execution.

CREATE TABLE IF NOT EXISTS message_templates (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(160) NOT NULL,
    subject     VARCHAR(255) NOT NULL,
    body_html   MEDIUMTEXT NOT NULL,
    description VARCHAR(500) NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automations (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name              VARCHAR(160) NOT NULL,
    trigger_event     ENUM(
        'lead_register',
        'community_submitted',
        'community_approved',
        'community_rejected',
        'report_status_changed',
        'scheduled',
        'manual'
    ) NOT NULL,
    template_id       BIGINT UNSIGNED NULL,
    is_active         TINYINT(1) NOT NULL DEFAULT 1,
    audience          ENUM('event', 'all_leads', 'selection') NOT NULL DEFAULT 'event',
    audience_user_ids JSON NULL,
    schedule_config   JSON NULL,
    last_run_at       TIMESTAMP NULL DEFAULT NULL,
    next_run_at       DATETIME NULL DEFAULT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_automations_trigger (trigger_event, is_active),
    KEY idx_automations_next_run (next_run_at),
    CONSTRAINT fk_automations_template FOREIGN KEY (template_id)
        REFERENCES message_templates (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    automation_id   BIGINT UNSIGNED NULL,
    trigger_event   VARCHAR(40) NOT NULL,
    recipient_email VARCHAR(190) NOT NULL,
    recipient_name  VARCHAR(160) NULL,
    user_id         BIGINT UNSIGNED NULL,
    subject         VARCHAR(255) NULL,
    status          ENUM('pending', 'sending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
    error           VARCHAR(500) NULL,
    context         JSON NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at         TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_automation_logs_status (status),
    KEY idx_automation_logs_automation (automation_id),
    KEY idx_automation_logs_created (created_at),
    CONSTRAINT fk_automation_logs_automation FOREIGN KEY (automation_id)
        REFERENCES automations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_automation_logs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
