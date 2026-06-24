<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\AutomationEngine;
use TCH\Database;
use TCH\Mailer;
use TCH\Request;
use TCH\Response;
use TCH\TemplateRenderer;
use TCH\Validator;

/**
 * Administration du module d'automatisation : modeles de message,
 * automatisations (declencheur -> modele), journal et execution manuelle.
 */
final class AutomationController
{
    private const EVENT_TRIGGERS = [
        'lead_register',
        'community_submitted',
        'community_approved',
        'community_rejected',
        'report_status_changed',
    ];

    private const ALL_TRIGGERS = [
        'lead_register' => "Inscription d'un nouveau lead",
        'community_submitted' => "Soumission d'une solution SaaS",
        'community_approved' => "Solution approuvee",
        'community_rejected' => "Solution rejetee",
        'report_status_changed' => "Changement de statut d'un signalement",
        'scheduled' => 'Planifie (date / recurrence)',
        'manual' => 'Declenchement manuel',
    ];

    /* ----------------------------- Meta ----------------------------- */

    public function meta(Request $request): void
    {
        Auth::requireAdmin();

        $triggers = [];
        foreach (self::ALL_TRIGGERS as $key => $label) {
            $triggers[] = [
                'key' => $key,
                'label' => $label,
                'kind' => in_array($key, self::EVENT_TRIGGERS, true) ? 'event' : $key,
                'variables' => TemplateRenderer::availableVariables($key),
            ];
        }

        Response::success([
            'triggers' => $triggers,
            'smtpConfigured' => Mailer::isConfigured(),
        ]);
    }

    /* -------------------------- Templates --------------------------- */

    public function templatesIndex(Request $request): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query('SELECT * FROM message_templates ORDER BY name ASC')->fetchAll();
        Response::success(['templates' => array_map([self::class, 'serializeTemplate'], $rows)]);
    }

    public function templateStore(Request $request): void
    {
        Auth::requireAdmin();
        $data = self::validateTemplate($request);

        $db = Database::connection();
        $db->prepare(
            'INSERT INTO message_templates (name, subject, body_html, description, created_at)
             VALUES (:name, :subject, :body, :description, NOW())'
        )->execute($data);

        $row = self::findTemplate((int) $db->lastInsertId());
        Response::success(['template' => self::serializeTemplate($row)], 'Modele cree.', 201);
    }

    public function templateUpdate(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        if (self::findTemplate($id) === null) {
            Response::error('Modele introuvable.', 404);
        }

        $data = self::validateTemplate($request);
        $data['id'] = $id;

        Database::connection()->prepare(
            'UPDATE message_templates SET name = :name, subject = :subject, body_html = :body, description = :description WHERE id = :id'
        )->execute($data);

        Response::success(['template' => self::serializeTemplate(self::findTemplate($id))], 'Modele mis a jour.');
    }

    public function templateDestroy(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        if (self::findTemplate($id) === null) {
            Response::error('Modele introuvable.', 404);
        }

        Database::connection()->prepare('DELETE FROM message_templates WHERE id = :id')->execute(['id' => $id]);
        Response::success(null, 'Modele supprime.');
    }

    /* ------------------------- Automations -------------------------- */

    public function index(Request $request): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(
            'SELECT a.*, t.name AS template_name
             FROM automations a
             LEFT JOIN message_templates t ON t.id = a.template_id
             ORDER BY a.created_at DESC'
        )->fetchAll();

        Response::success(['automations' => array_map([self::class, 'serializeAutomation'], $rows)]);
    }

    public function store(Request $request): void
    {
        Auth::requireAdmin();
        $data = self::validateAutomation($request, null);

        $db = Database::connection();
        $db->prepare(
            'INSERT INTO automations
                (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, next_run_at, created_at)
             VALUES (:name, :trigger, :template, :active, :audience, :ids, :schedule, :next, NOW())'
        )->execute($data);

        $row = self::findAutomationJoined((int) $db->lastInsertId());
        Response::success(['automation' => self::serializeAutomation($row)], 'Automatisation creee.', 201);
    }

    public function update(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        if (self::findAutomation($id) === null) {
            Response::error('Automatisation introuvable.', 404);
        }

        $data = self::validateAutomation($request, $id);
        $data['id'] = $id;

        Database::connection()->prepare(
            'UPDATE automations SET
                name = :name, trigger_event = :trigger, template_id = :template, is_active = :active,
                audience = :audience, audience_user_ids = :ids, schedule_config = :schedule, next_run_at = :next
             WHERE id = :id'
        )->execute($data);

        Response::success(['automation' => self::serializeAutomation(self::findAutomationJoined($id))], 'Automatisation mise a jour.');
    }

    public function toggle(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        $row = self::findAutomation($id);
        if ($row === null) {
            Response::error('Automatisation introuvable.', 404);
        }

        $active = filter_var($request->input('isActive'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        Database::connection()->prepare('UPDATE automations SET is_active = :active WHERE id = :id')
            ->execute(['active' => $active, 'id' => $id]);

        Response::success(['automation' => self::serializeAutomation(self::findAutomationJoined($id))], $active ? 'Automatisation activee.' : 'Automatisation desactivee.');
    }

    public function destroy(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        if (self::findAutomation($id) === null) {
            Response::error('Automatisation introuvable.', 404);
        }
        Database::connection()->prepare('DELETE FROM automations WHERE id = :id')->execute(['id' => $id]);
        Response::success(null, 'Automatisation supprimee.');
    }

    /** Declenchement manuel immediat. */
    public function run(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        $row = self::findAutomation($id);
        if ($row === null) {
            Response::error('Automatisation introuvable.', 404);
        }

        if (!Mailer::isConfigured()) {
            Response::error('SMTP non configure (variables MAIL_*).', 503);
        }

        if (($row['audience'] ?? 'event') === 'event') {
            Response::error("Cette automatisation est evenementielle : elle se declenche automatiquement, pas manuellement.", 422);
        }

        $stats = AutomationEngine::runNow($id);
        Response::success(
            ['stats' => $stats],
            "Execution terminee : {$stats['sent']} envoye(s), {$stats['failed']} echec(s).",
        );
    }

    /** Journal des executions. */
    public function logs(Request $request): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(
            'SELECT l.*, a.name AS automation_name
             FROM automation_logs l
             LEFT JOIN automations a ON a.id = l.automation_id
             ORDER BY l.created_at DESC
             LIMIT 200'
        )->fetchAll();

        Response::success(['logs' => array_map([self::class, 'serializeLog'], $rows)]);
    }

    /** Envoi d'un email de test a l'admin courant a partir d'un modele. */
    public function test(Request $request): void
    {
        $admin = Auth::requireAdmin();

        if (!Mailer::isConfigured()) {
            Response::error('SMTP non configure (variables MAIL_*).', 503);
        }

        $templateId = (int) $request->input('templateId');
        $template = self::findTemplate($templateId);
        if ($template === null) {
            Response::error('Modele introuvable.', 404);
        }

        $context = array_merge(TemplateRenderer::baseContext(), [
            'nom' => $admin['name'] ?? 'Admin',
            'email' => $admin['email'] ?? '',
            'solution' => 'Solution de demonstration',
            'statut' => 'approuvee',
            'code' => 'DEMO-1234',
        ]);

        $subject = '[TEST] ' . TemplateRenderer::render((string) $template['subject'], $context);
        $body = TemplateRenderer::render((string) $template['body_html'], $context);

        $res = (new Mailer())->send((string) $admin['email'], (string) ($admin['name'] ?? null), $subject, $body);
        if (!$res['ok']) {
            Response::error('Echec du test : ' . ($res['error'] ?? 'inconnu'), 502);
        }

        Response::success(null, 'Email de test envoye a ' . $admin['email'] . '.');
    }

    /* --------------------------- Validation ------------------------- */

    /** @return array{name: string, subject: string, body: string, description: ?string} */
    private static function validateTemplate(Request $request): array
    {
        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:160',
            'subject' => 'required|min:2|max:255',
            'bodyHtml' => 'required|min:1',
            'description' => 'max:500',
        ])->abortIfFails();

        return [
            'name' => trim((string) $request->input('name')),
            'subject' => trim((string) $request->input('subject')),
            'body' => self::sanitizeHtml((string) $request->input('bodyHtml')),
            'description' => $request->input('description') ? trim((string) $request->input('description')) : null,
        ];
    }

    /**
     * @return array{name: string, trigger: string, template: int, active: int, audience: string, ids: ?string, schedule: ?string, next: ?string}
     */
    private static function validateAutomation(Request $request, ?int $existingId): array
    {
        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:160',
            'triggerEvent' => 'required',
        ])->abortIfFails();

        $trigger = (string) $request->input('triggerEvent');
        if (!array_key_exists($trigger, self::ALL_TRIGGERS)) {
            Response::error('Declencheur invalide.', 422);
        }

        $templateId = (int) $request->input('templateId');
        if ($templateId <= 0 || self::findTemplate($templateId) === null) {
            Response::error('Selectionnez un modele de message valide.', 422);
        }

        $isActive = $request->input('isActive') === null ? 1 : (filter_var($request->input('isActive'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0);

        // Audience derivee du type de declencheur.
        $audience = 'event';
        $idsJson = null;
        $scheduleJson = null;
        $nextRun = null;

        if (!in_array($trigger, self::EVENT_TRIGGERS, true)) {
            // scheduled ou manual : audience requise.
            $audience = (string) $request->input('audience', 'all_leads');
            if (!in_array($audience, ['all_leads', 'selection'], true)) {
                Response::error('Audience invalide.', 422);
            }

            if ($audience === 'selection') {
                $ids = $request->input('userIds');
                $ids = is_array($ids) ? array_values(array_unique(array_filter(array_map('intval', $ids)))) : [];
                if ($ids === []) {
                    Response::error('Selectionnez au moins un destinataire.', 422);
                }
                $idsJson = json_encode($ids);
            }

            if ($trigger === 'scheduled') {
                $schedule = $request->input('schedule');
                if (!is_array($schedule)) {
                    Response::error('Configuration de planification requise.', 422);
                }
                $mode = (string) ($schedule['mode'] ?? 'once');
                if (!in_array($mode, ['once', 'daily', 'weekly', 'monthly'], true)) {
                    Response::error('Mode de planification invalide.', 422);
                }
                $scheduleJson = json_encode($schedule, JSON_UNESCAPED_UNICODE);
                $nextRun = AutomationEngine::computeNextRun($schedule, new \DateTimeImmutable('now'));
                if ($nextRun === null && $mode === 'once') {
                    Response::error('La date planifiee doit etre dans le futur.', 422);
                }
            }
        }

        return [
            'name' => trim((string) $request->input('name')),
            'trigger' => $trigger,
            'template' => $templateId,
            'active' => $isActive,
            'audience' => $audience,
            'ids' => $idsJson,
            'schedule' => $scheduleJson,
            'next' => $nextRun,
        ];
    }

    /** Nettoyage HTML basique (scripts, handlers, javascript:). */
    private static function sanitizeHtml(string $html): string
    {
        $html = preg_replace('#<\s*(script|style|iframe|object|embed|form)\b[^>]*>.*?<\s*/\s*\1\s*>#is', '', $html) ?? $html;
        $html = preg_replace('#<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*>#is', '', $html) ?? $html;
        $html = preg_replace('#\son\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)#is', '', $html) ?? $html;
        $html = preg_replace('#(href|src)\s*=\s*("|\')\s*javascript:[^"\']*\2#is', '$1=$2#$2', $html) ?? $html;
        return trim($html);
    }

    /* -------------------------- Serializers ------------------------- */

    private static function serializeTemplate(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'subject' => $row['subject'],
            'bodyHtml' => $row['body_html'],
            'description' => $row['description'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    private static function serializeAutomation(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'triggerEvent' => $row['trigger_event'],
            'triggerLabel' => self::ALL_TRIGGERS[$row['trigger_event']] ?? $row['trigger_event'],
            'templateId' => $row['template_id'] !== null ? (int) $row['template_id'] : null,
            'templateName' => $row['template_name'] ?? null,
            'isActive' => (bool) $row['is_active'],
            'audience' => $row['audience'],
            'audienceUserIds' => $row['audience_user_ids'] ? (json_decode((string) $row['audience_user_ids'], true) ?: []) : [],
            'schedule' => $row['schedule_config'] ? (json_decode((string) $row['schedule_config'], true) ?: null) : null,
            'lastRunAt' => $row['last_run_at'] ?? null,
            'nextRunAt' => $row['next_run_at'] ?? null,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    private static function serializeLog(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'automationId' => $row['automation_id'] !== null ? (int) $row['automation_id'] : null,
            'automationName' => $row['automation_name'] ?? null,
            'triggerEvent' => $row['trigger_event'],
            'recipientEmail' => $row['recipient_email'],
            'recipientName' => $row['recipient_name'],
            'subject' => $row['subject'],
            'status' => $row['status'],
            'error' => $row['error'],
            'createdAt' => $row['created_at'],
            'sentAt' => $row['sent_at'] ?? null,
        ];
    }

    /* ---------------------------- Finders --------------------------- */

    private static function findTemplate(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM message_templates WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    private static function findAutomation(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM automations WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    private static function findAutomationJoined(int $id): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT a.*, t.name AS template_name FROM automations a
             LEFT JOIN message_templates t ON t.id = a.template_id WHERE a.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: [];
    }
}
