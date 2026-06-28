<?php

declare(strict_types=1);

namespace TCH;

use PDO;

/**
 * Moteur d'automatisation : met en file et envoie les emails declenches par des
 * evenements (inscription, soumission/validation de solution, signalement),
 * par planification (cron) ou manuellement.
 *
 * Conception non bloquante : `fire()` se contente d'inserer des entrees en file
 * (rapide) puis programme le traitement reel apres l'envoi de la reponse HTTP
 * (fastcgi_finish_request). Toute erreur est absorbee pour ne jamais casser la
 * requete hote (ex. une inscription doit reussir meme si l'email echoue).
 */
final class AutomationEngine
{
    private static bool $shutdownRegistered = false;

    /**
     * Declenche les automatisations evenementielles pour $event.
     * $context doit contenir au moins 'email' (destinataire).
     */
    public static function fire(string $event, array $context): void
    {
        try {
            $email = strtolower(trim((string) ($context['email'] ?? '')));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return;
            }
            // Ne jamais envoyer vers une adresse sentinelle (compte cree sans email reel) : evite les bounces.
            if (str_ends_with($email, '@togosaas.invalid')) {
                return;
            }

            $db = Database::connection();
            $stmt = $db->prepare(
                "SELECT id FROM automations
                 WHERE trigger_event = :event AND is_active = 1 AND audience = 'event' AND template_id IS NOT NULL"
            );
            $stmt->execute(['event' => $event]);
            $automationIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (!$automationIds) {
                return;
            }

            $payload = array_merge(TemplateRenderer::baseContext(), $context);

            foreach ($automationIds as $automationId) {
                self::enqueueLog(
                    (int) $automationId,
                    $event,
                    $email,
                    isset($context['name']) ? (string) $context['name'] : null,
                    isset($context['user_id']) ? (int) $context['user_id'] : null,
                    $payload
                );
            }

            self::scheduleBackgroundProcessing();

            // Notification push non bloquante au destinataire (si abonne et connu).
            $targetUserId = isset($context['user_id']) ? (int) $context['user_id'] : 0;
            if ($targetUserId > 0) {
                Notifier::push(
                    $targetUserId,
                    'TogoSaaS',
                    'Une nouvelle activite concerne votre compte.',
                    '/espace-lead'
                );
            }
        } catch (\Throwable $e) {
            // Ne jamais propager : l'automatisation est best-effort.
            self::logError('fire', $e);
        }
    }

    /** Insere une entree de file (statut pending). */
    private static function enqueueLog(
        int $automationId,
        string $event,
        string $email,
        ?string $name,
        ?int $userId,
        array $context
    ): void {
        Database::connection()->prepare(
            'INSERT INTO automation_logs
                (automation_id, trigger_event, recipient_email, recipient_name, user_id, status, context, created_at)
             VALUES (:aid, :event, :email, :name, :uid, :status, :context, NOW())'
        )->execute([
            'aid' => $automationId,
            'event' => $event,
            'email' => $email,
            'name' => $name,
            'uid' => $userId,
            'status' => 'pending',
            'context' => json_encode($context, JSON_UNESCAPED_UNICODE),
        ]);
    }

    /**
     * Programme le traitement de la file APRES l'envoi de la reponse au client
     * (via fastcgi_finish_request si disponible), sinon a l'extinction du script.
     */
    private static function scheduleBackgroundProcessing(): void
    {
        if (self::$shutdownRegistered) {
            return;
        }
        self::$shutdownRegistered = true;

        register_shutdown_function(static function (): void {
            try {
                if (function_exists('fastcgi_finish_request')) {
                    @fastcgi_finish_request();
                }
                @set_time_limit(0);
                ignore_user_abort(true);
                self::processPending(50);
            } catch (\Throwable $e) {
                self::logError('shutdown', $e);
            }
        });
    }

    /**
     * Traite les entrees en attente : rend le modele et envoie l'email.
     *
     * @return array{processed: int, sent: int, failed: int, skipped: int}
     */
    public static function processPending(int $limit = 50, int $maxSeconds = 25): array
    {
        $result = ['processed' => 0, 'sent' => 0, 'failed' => 0, 'skipped' => 0];

        try {
            $db = Database::connection();

            // Reprise des envois bloques : si un process est mort en laissant des
            // entrees coincees en 'sending', on les remet en 'pending' apres un
            // delai de securite (10 min) pour qu'elles soient retraitees.
            $db->exec(
                "UPDATE automation_logs
                 SET status = 'pending'
                 WHERE status = 'sending' AND created_at < (NOW() - INTERVAL 10 MINUTE)"
            );

            $stmt = $db->prepare(
                "SELECT id FROM automation_logs WHERE status = 'pending' ORDER BY created_at ASC LIMIT {$limit}"
            );
            $stmt->execute();
            $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
            if (!$ids) {
                return $result;
            }

            $mailerConfigured = Mailer::isConfigured();
            $mailer = $mailerConfigured ? new Mailer() : null;
            $start = microtime(true);

            $claim = $db->prepare("UPDATE automation_logs SET status = 'sending' WHERE id = :id AND status = 'pending'");
            $markSent = $db->prepare("UPDATE automation_logs SET status = 'sent', subject = :subject, error = NULL, sent_at = NOW() WHERE id = :id");
            $markFailed = $db->prepare("UPDATE automation_logs SET status = 'failed', subject = :subject, error = :error WHERE id = :id");
            $markSkipped = $db->prepare("UPDATE automation_logs SET status = 'skipped', error = :error WHERE id = :id");

            foreach ($ids as $rawId) {
                if (microtime(true) - $start > $maxSeconds) {
                    break;
                }

                $id = (int) $rawId;
                $claim->execute(['id' => $id]);
                if ($claim->rowCount() !== 1) {
                    continue; // deja pris par un autre worker
                }
                $result['processed']++;

                $log = self::findLog($id);
                if ($log === null) {
                    continue;
                }

                $automation = $log['automation_id'] !== null ? self::findAutomation((int) $log['automation_id']) : null;
                if ($automation === null || empty($automation['template_id'])) {
                    $markSkipped->execute(['error' => 'Automatisation ou modele introuvable.', 'id' => $id]);
                    $result['skipped']++;
                    continue;
                }

                $template = self::findTemplate((int) $automation['template_id']);
                if ($template === null) {
                    $markSkipped->execute(['error' => 'Modele de message introuvable.', 'id' => $id]);
                    $result['skipped']++;
                    continue;
                }

                $context = json_decode((string) ($log['context'] ?? '{}'), true) ?: [];
                if (!isset($context['nom']) && $log['recipient_name']) {
                    $context['nom'] = $log['recipient_name'];
                }
                if (!isset($context['email'])) {
                    $context['email'] = $log['recipient_email'];
                }

                $subject = TemplateRenderer::render((string) $template['subject'], $context);
                $body = TemplateRenderer::render((string) $template['body_html'], $context);

                if (!$mailerConfigured || $mailer === null) {
                    $markFailed->execute([
                        'subject' => mb_substr($subject, 0, 255),
                        'error' => 'SMTP non configure (variables MAIL_*).',
                        'id' => $id,
                    ]);
                    $result['failed']++;
                    continue;
                }

                $sendResult = $mailer->send(
                    (string) $log['recipient_email'],
                    $log['recipient_name'] !== null ? (string) $log['recipient_name'] : null,
                    $subject,
                    $body
                );

                if ($sendResult['ok']) {
                    $markSent->execute(['subject' => mb_substr($subject, 0, 255), 'id' => $id]);
                    $result['sent']++;
                } else {
                    // On journalise le VRAI message SMTP (detail) meme si APP_DEBUG=false :
                    // indispensable pour diagnostiquer un email mal saisi / un refus serveur.
                    // Ce champ n'est visible que par l'admin (jamais en reponse publique).
                    $reason = (string) ($sendResult['detail'] ?? $sendResult['error'] ?? 'Echec inconnu.');
                    $markFailed->execute([
                        'subject' => mb_substr($subject, 0, 255),
                        'error' => mb_substr($reason, 0, 480),
                        'id' => $id,
                    ]);
                    $result['failed']++;
                }
            }
        } catch (\Throwable $e) {
            self::logError('processPending', $e);
        }

        return $result;
    }

    /**
     * Execute immediatement une automatisation (declenchement manuel).
     * Met en file pour son audience puis traite la file de maniere synchrone.
     *
     * @return array{queued: int, sent: int, failed: int, skipped: int}
     */
    public static function runNow(int $automationId): array
    {
        $automation = self::findAutomation($automationId);
        if ($automation === null) {
            return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'skipped' => 0];
        }

        $queued = self::enqueueForAudience($automation);
        $processed = self::processPending(max(1, $queued), 50);

        self::touchLastRun($automationId);

        return [
            'queued' => $queued,
            'sent' => $processed['sent'],
            'failed' => $processed['failed'],
            'skipped' => $processed['skipped'],
        ];
    }

    /**
     * Traite les automatisations planifiees dont l'echeance est atteinte.
     * Appelee par le worker cron.
     *
     * @return array{automations: int, queued: int, sent: int, failed: int}
     */
    public static function runDueScheduled(): array
    {
        $summary = ['automations' => 0, 'queued' => 0, 'sent' => 0, 'failed' => 0];

        $db = Database::connection();
        $rows = $db->query(
            "SELECT * FROM automations
             WHERE is_active = 1 AND trigger_event = 'scheduled'
               AND next_run_at IS NOT NULL AND next_run_at <= NOW()"
        )->fetchAll();

        foreach ($rows as $automation) {
            $summary['automations']++;
            $queued = self::enqueueForAudience($automation);
            $summary['queued'] += $queued;

            $config = json_decode((string) ($automation['schedule_config'] ?? '{}'), true) ?: [];
            $next = self::computeNextRun($config, new \DateTimeImmutable('now'));

            if ($next === null) {
                // Mode "une fois" : desactive apres execution.
                $db->prepare('UPDATE automations SET last_run_at = NOW(), next_run_at = NULL, is_active = 0 WHERE id = :id')
                    ->execute(['id' => (int) $automation['id']]);
            } else {
                $db->prepare('UPDATE automations SET last_run_at = NOW(), next_run_at = :next WHERE id = :id')
                    ->execute(['next' => $next, 'id' => (int) $automation['id']]);
            }
        }

        $processed = self::processPending(500, 50);
        $summary['sent'] = $processed['sent'];
        $summary['failed'] = $processed['failed'];

        return $summary;
    }

    /** Met en file les destinataires de l'audience d'une automatisation. */
    private static function enqueueForAudience(array $automation): int
    {
        $recipients = self::resolveAudienceRecipients($automation);
        if ($recipients === []) {
            return 0;
        }

        $base = TemplateRenderer::baseContext();
        $count = 0;

        foreach ($recipients as $r) {
            $context = array_merge($base, [
                'nom' => $r['name'] ?? '',
                'email' => $r['email'],
            ]);
            self::enqueueLog(
                (int) $automation['id'],
                (string) $automation['trigger_event'],
                $r['email'],
                $r['name'] ?? null,
                $r['user_id'] ?? null,
                $context
            );
            $count++;
        }

        return $count;
    }

    /**
     * Resout les destinataires pour les audiences all_leads / selection.
     *
     * @return list<array{email: string, name: ?string, user_id: ?int}>
     */
    private static function resolveAudienceRecipients(array $automation): array
    {
        $db = Database::connection();
        $audience = (string) ($automation['audience'] ?? 'event');

        if ($audience === 'all_leads') {
            $rows = $db->query(
                "SELECT id, name, email FROM users WHERE role = 'lead' AND email IS NOT NULL AND email <> '' AND email NOT LIKE '%@togosaas.invalid' ORDER BY name ASC"
            )->fetchAll();
        } elseif ($audience === 'selection') {
            $ids = json_decode((string) ($automation['audience_user_ids'] ?? '[]'), true);
            $ids = is_array($ids) ? array_values(array_unique(array_filter(array_map('intval', $ids)))) : [];
            if ($ids === []) {
                return [];
            }
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare(
                "SELECT id, name, email FROM users WHERE role = 'lead' AND email IS NOT NULL AND email <> '' AND email NOT LIKE '%@togosaas.invalid' AND id IN ($placeholders)"
            );
            $stmt->execute($ids);
            $rows = $stmt->fetchAll();
        } else {
            return [];
        }

        return array_map(static fn($r) => [
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
            'user_id' => (int) $r['id'],
        ], $rows);
    }

    /** Calcule la prochaine echeance selon la config de planification. */
    public static function computeNextRun(array $config, \DateTimeImmutable $from): ?string
    {
        $mode = (string) ($config['mode'] ?? 'once');
        $time = (string) ($config['time'] ?? '09:00');
        [$h, $m] = array_pad(array_map('intval', explode(':', $time)), 2, 0);

        if ($mode === 'once') {
            $date = (string) ($config['date'] ?? '');
            if ($date === '') {
                return null;
            }
            $dt = \DateTimeImmutable::createFromFormat('Y-m-d H:i', $date . ' ' . sprintf('%02d:%02d', $h, $m));
            if ($dt === false) {
                return null;
            }
            return $dt > $from ? $dt->format('Y-m-d H:i:s') : null;
        }

        if ($mode === 'daily') {
            $candidate = $from->setTime($h, $m);
            if ($candidate <= $from) {
                $candidate = $candidate->modify('+1 day');
            }
            return $candidate->format('Y-m-d H:i:s');
        }

        if ($mode === 'weekly') {
            $targetDow = max(1, min(7, (int) ($config['dayOfWeek'] ?? 1))); // 1=lundi ... 7=dimanche
            $candidate = $from->setTime($h, $m);
            $currentDow = (int) $candidate->format('N');
            $diff = ($targetDow - $currentDow + 7) % 7;
            if ($diff === 0 && $candidate <= $from) {
                $diff = 7;
            }
            return $candidate->modify("+{$diff} day")->format('Y-m-d H:i:s');
        }

        if ($mode === 'monthly') {
            $dom = max(1, min(28, (int) ($config['dayOfMonth'] ?? 1)));
            $candidate = $from->setTime($h, $m)->modify('first day of this month')->modify('+' . ($dom - 1) . ' day');
            if ($candidate <= $from) {
                $candidate = $from->setTime($h, $m)->modify('first day of next month')->modify('+' . ($dom - 1) . ' day');
            }
            return $candidate->format('Y-m-d H:i:s');
        }

        return null;
    }

    private static function touchLastRun(int $automationId): void
    {
        Database::connection()->prepare('UPDATE automations SET last_run_at = NOW() WHERE id = :id')
            ->execute(['id' => $automationId]);
    }

    private static function findLog(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM automation_logs WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private static function findAutomation(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM automations WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private static function findTemplate(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM message_templates WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private static function logError(string $where, \Throwable $e): void
    {
        if (TCH_DEBUG) {
            error_log("[AutomationEngine::{$where}] " . $e->getMessage());
        }
    }
}
