<?php

declare(strict_types=1);

namespace TCH;

use PDO;

/**
 * Moteur d'automatisation : met en file et envoie les emails declenches par des
 * evenements (inscription, soumission/validation de solution, avis, signalement),
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

    /** Audiences resolues par le moteur (hors event). */
    public const SMART_AUDIENCES = [
        'all_leads',
        'selection',
        'leads_no_solution',
        'leads_inactive',
        'leads_incomplete_profile',
        'leads_pending_review',
        'leads_with_solution',
        'leads_dormant_solution',
        'leads_stale_profile',
        'leads_onboarding_d3',
        'leads_onboarding_d7',
        'leads_recently_approved',
        'admins',
        'category_tag',
    ];

    /** Cooldown par defaut (jours) selon audience ou evenement. */
    private const DEFAULT_COOLDOWNS = [
        'leads_no_solution' => 14,
        'leads_inactive' => 21,
        'leads_incomplete_profile' => 14,
        'leads_pending_review' => 7,
        'leads_with_solution' => 6,
        'leads_dormant_solution' => 42,
        'leads_stale_profile' => 56,
        'leads_onboarding_d3' => 365,
        'leads_onboarding_d7' => 365,
        'leads_recently_approved' => 30,
        'admins' => 6,
        'category_tag' => 30,
        'all_leads' => 7,
        'selection' => 0,
        'review_created' => 1,
        'rating_threshold' => 365,
        'report_filed' => 1,
        'community_approved' => 0,
        'community_rejected' => 0,
        'lead_register' => 0,
        'community_submitted' => 0,
        'report_status_changed' => 0,
    ];

    /**
     * Declenche un evenement pour le proprietaire (lead) d'une solution.
     * Best-effort : silencieux si owner introuvable ou email sentinelle.
     *
     * @param array<string, mixed> $extra
     */
    public static function fireForCommunityOwner(int $communityId, string $event, array $extra = []): void
    {
        try {
            $stmt = Database::connection()->prepare(
                "SELECT c.id, c.name, c.slug, c.leader_name, c.leader_email,
                        u.id AS owner_id, u.name AS owner_name, u.email AS owner_email
                 FROM communities c
                 LEFT JOIN users u ON u.id = c.user_id
                 WHERE c.id = :id LIMIT 1"
            );
            $stmt->execute(['id' => $communityId]);
            $row = $stmt->fetch();
            if (!$row) {
                return;
            }

            $email = (string) ($row['owner_email'] ?? $row['leader_email'] ?? '');
            $name = (string) ($row['owner_name'] ?? $row['leader_name'] ?? '');
            $userId = isset($row['owner_id']) && $row['owner_id'] !== null ? (int) $row['owner_id'] : null;
            $slug = (string) ($row['slug'] ?? $communityId);
            $url = self::frontendUrl() . '/solutions/' . rawurlencode($slug !== '' ? $slug : (string) $communityId);
            $shareText = rawurlencode('Decouvrez ' . (string) $row['name'] . ' sur TogoSaaS : ' . $url);

            self::fire($event, array_merge([
                'email' => $email,
                'name' => $name,
                'nom' => $name,
                'user_id' => $userId,
                'solution' => (string) $row['name'],
                'community_url' => $url,
                'share_linkedin' => 'https://www.linkedin.com/sharing/share-offsite/?url=' . rawurlencode($url),
                'share_whatsapp' => 'https://wa.me/?text=' . $shareText,
                'cta_url' => self::frontendUrl() . '/espace-lead',
            ], $extra));
        } catch (\Throwable $e) {
            self::logError('fireForCommunityOwner', $e);
        }
    }

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
            // Ne jamais envoyer vers une adresse sentinelle (compte cree sans email reel).
            if (self::isSentinelEmail($email)) {
                return;
            }

            $db = Database::connection();
            $stmt = $db->prepare(
                "SELECT id, schedule_config FROM automations
                 WHERE trigger_event = :event AND is_active = 1 AND audience = 'event' AND template_id IS NOT NULL"
            );
            $stmt->execute(['event' => $event]);
            $automations = $stmt->fetchAll();

            if (!$automations) {
                return;
            }

            $payload = array_merge(TemplateRenderer::baseContext(), $context);
            if (!isset($payload['nom']) && isset($context['name'])) {
                $payload['nom'] = (string) $context['name'];
            }
            if (!isset($payload['frontend_url'])) {
                $payload['frontend_url'] = self::frontendUrl();
            }

            $userId = isset($context['user_id']) ? (int) $context['user_id'] : null;

            foreach ($automations as $auto) {
                $automationId = (int) $auto['id'];
                $config = json_decode((string) ($auto['schedule_config'] ?? '{}'), true) ?: [];
                $cooldown = self::resolveCooldown($config, $event);

                if (self::wasRecentlyQueuedOrSent($automationId, $userId, $email, $cooldown)) {
                    continue;
                }

                self::enqueueLog(
                    $automationId,
                    $event,
                    $email,
                    isset($context['name']) ? (string) $context['name'] : (isset($context['nom']) ? (string) $context['nom'] : null),
                    $userId,
                    $payload
                );
            }

            self::scheduleBackgroundProcessing();

            $targetUserId = $userId ?? 0;
            if ($targetUserId > 0) {
                Notifier::push(
                    $targetUserId,
                    'TogoSaaS',
                    'Une nouvelle activite concerne votre compte.',
                    '/espace-lead'
                );
            }
        } catch (\Throwable $e) {
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
        if (self::isSentinelEmail($email)) {
            return;
        }

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
                    continue;
                }
                $result['processed']++;

                $log = self::findLog($id);
                if ($log === null) {
                    continue;
                }

                $recipientEmail = strtolower(trim((string) $log['recipient_email']));
                if (self::isSentinelEmail($recipientEmail)) {
                    $markSkipped->execute(['error' => 'Adresse sentinelle exclue.', 'id' => $id]);
                    $result['skipped']++;
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
                if (!isset($context['frontend_url'])) {
                    $context['frontend_url'] = self::frontendUrl();
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

        $config = json_decode((string) ($automation['schedule_config'] ?? '{}'), true) ?: [];
        $audience = (string) ($automation['audience'] ?? 'event');
        $cooldown = self::resolveCooldown($config, $audience);
        $base = TemplateRenderer::baseContext();
        $base['frontend_url'] = self::frontendUrl();
        $count = 0;
        $automationId = (int) $automation['id'];
        $trigger = (string) $automation['trigger_event'];

        foreach ($recipients as $r) {
            $email = strtolower(trim((string) $r['email']));
            if ($email === '' || self::isSentinelEmail($email)) {
                continue;
            }

            $userId = isset($r['user_id']) ? (int) $r['user_id'] : null;
            if (self::wasRecentlyQueuedOrSent($automationId, $userId, $email, $cooldown)) {
                continue;
            }

            $context = array_merge($base, $r['context'] ?? [], [
                'nom' => $r['name'] ?? '',
                'email' => $email,
            ]);

            self::enqueueLog(
                $automationId,
                $trigger,
                $email,
                $r['name'] ?? null,
                $userId,
                $context
            );
            $count++;
        }

        return $count;
    }

    /**
     * Resout les destinataires pour les audiences planifiees / manuelles.
     *
     * @return list<array{email: string, name: ?string, user_id: ?int, context?: array}>
     */
    private static function resolveAudienceRecipients(array $automation): array
    {
        $db = Database::connection();
        $audience = (string) ($automation['audience'] ?? 'event');
        $config = json_decode((string) ($automation['schedule_config'] ?? '{}'), true) ?: [];

        if ($audience === 'event') {
            return [];
        }

        if ($audience === 'selection') {
            $ids = json_decode((string) ($automation['audience_user_ids'] ?? '[]'), true);
            $ids = is_array($ids) ? array_values(array_unique(array_filter(array_map('intval', $ids)))) : [];
            if ($ids === []) {
                return [];
            }
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare(
                "SELECT id, name, email FROM users
                 WHERE role = 'lead' AND email IS NOT NULL AND email <> ''
                   AND email NOT LIKE '%@togosaas.invalid'
                   AND id IN ($placeholders)"
            );
            $stmt->execute($ids);
            return self::mapUserRows($stmt->fetchAll());
        }

        if ($audience === 'all_leads') {
            $rows = $db->query(
                "SELECT id, name, email FROM users
                 WHERE role = 'lead' AND email IS NOT NULL AND email <> ''
                   AND email NOT LIKE '%@togosaas.invalid'
                 ORDER BY name ASC"
            )->fetchAll();
            return self::mapUserRows($rows);
        }

        if ($audience === 'admins') {
            return self::resolveAdminsDigest($db);
        }

        if ($audience === 'category_tag') {
            return self::resolveCategoryTag($db, $config);
        }

        return match ($audience) {
            'leads_no_solution' => self::resolveLeadsNoSolution($db),
            'leads_inactive' => self::resolveLeadsInactive($db, (int) ($config['inactive_days'] ?? 21)),
            'leads_incomplete_profile' => self::resolveLeadsIncompleteProfile($db),
            'leads_pending_review' => self::resolveLeadsPendingReview($db),
            'leads_with_solution' => self::resolveLeadsWithSolution($db, true),
            'leads_dormant_solution' => self::resolveLeadsDormant($db, (int) ($config['dormant_weeks'] ?? 6)),
            'leads_stale_profile' => self::resolveLeadsStale($db, (int) ($config['stale_weeks'] ?? 10)),
            'leads_onboarding_d3' => self::resolveOnboardingDay($db, 3),
            'leads_onboarding_d7' => self::resolveOnboardingDay($db, 7),
            'leads_recently_approved' => self::resolveRecentlyApproved($db, (int) ($config['approved_within_days'] ?? 3)),
            default => [],
        };
    }

    /** @param list<array> $rows */
    private static function mapUserRows(array $rows): array
    {
        return array_map(static fn($r) => [
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
            'user_id' => (int) $r['id'],
            'context' => [],
        ], $rows);
    }

    private static function leadBaseSql(): string
    {
        return "SELECT u.id, u.name, u.email, u.phone, u.created_at, u.updated_at
                FROM users u
                WHERE u.role = 'lead'
                  AND u.email IS NOT NULL AND u.email <> ''
                  AND u.email NOT LIKE '%@togosaas.invalid'";
    }

    private static function resolveLeadsNoSolution(PDO $db): array
    {
        $rows = $db->query(
            self::leadBaseSql() . "
              AND NOT EXISTS (
                SELECT 1 FROM communities c
                WHERE c.user_id = u.id AND c.status = 'approved'
              )
            ORDER BY u.name ASC"
        )->fetchAll();

        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'email' => (string) $r['email'],
                'name' => $r['name'] !== null ? (string) $r['name'] : null,
                'user_id' => (int) $r['id'],
                'context' => [
                    'cta_url' => self::frontendUrl() . '/espace-lead/communautes/nouvelle',
                    'solution' => '',
                ],
            ];
        }
        return $out;
    }

    private static function resolveLeadsInactive(PDO $db, int $days): array
    {
        $days = max(7, min(90, $days));
        $rows = $db->query(
            self::leadBaseSql() . "
              AND u.created_at <= (NOW() - INTERVAL {$days} DAY)
              AND GREATEST(
                    COALESCE(u.updated_at, u.created_at),
                    COALESCE((
                        SELECT MAX(COALESCE(c.updated_at, c.created_at))
                        FROM communities c WHERE c.user_id = u.id
                    ), u.created_at)
                 ) <= (NOW() - INTERVAL {$days} DAY)
            ORDER BY u.name ASC"
        )->fetchAll();

        return array_map(static fn($r) => [
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
            'user_id' => (int) $r['id'],
            'context' => [
                'inactive_days' => (string) $days,
                'cta_url' => self::frontendUrl() . '/espace-lead',
            ],
        ], $rows);
    }

    private static function resolveLeadsIncompleteProfile(PDO $db): array
    {
        $rows = $db->query(
            self::leadBaseSql() . ' ORDER BY u.name ASC'
        )->fetchAll();

        $out = [];
        foreach ($rows as $r) {
            $profile = self::computeProfileCompleteness($db, $r);
            if ($profile['pct'] >= 80) {
                continue;
            }
            $out[] = [
                'email' => (string) $r['email'],
                'name' => $r['name'] !== null ? (string) $r['name'] : null,
                'user_id' => (int) $r['id'],
                'context' => [
                    'profile_pct' => (string) $profile['pct'],
                    'missing_fields' => $profile['missing'],
                    'solution' => $profile['solution'],
                    'cta_url' => self::frontendUrl() . '/espace-lead',
                ],
            ];
        }
        return $out;
    }

    /**
     * @param array{id: mixed, phone: mixed, email: mixed} $user
     * @return array{pct: int, missing: string, solution: string}
     */
    private static function computeProfileCompleteness(PDO $db, array $user): array
    {
        $checks = [];
        $missing = [];

        $phone = trim((string) ($user['phone'] ?? ''));
        $checks[] = $phone !== '';
        if ($phone === '') {
            $missing[] = 'telephone';
        }

        $stmt = $db->prepare(
            "SELECT id, name, gallery, website_url, app_url, whatsapp_url, linkedin_url, telegram_url, twitter_url, logo_url, short_description
             FROM communities WHERE user_id = :uid ORDER BY FIELD(status, 'approved', 'pending', 'rejected'), updated_at DESC LIMIT 1"
        );
        $stmt->execute(['uid' => (int) $user['id']]);
        $c = $stmt->fetch() ?: null;

        $hasCommunity = $c !== null;
        $checks[] = $hasCommunity;
        if (!$hasCommunity) {
            $missing[] = 'solution publiee';
        }

        $gallery = $c ? (json_decode((string) ($c['gallery'] ?? '[]'), true) ?: []) : [];
        $hasGallery = is_array($gallery) && count($gallery) > 0;
        $checks[] = $hasGallery;
        if ($hasCommunity && !$hasGallery) {
            $missing[] = 'galerie';
        }

        $hasLink = false;
        if ($c) {
            foreach (['website_url', 'app_url', 'whatsapp_url', 'linkedin_url', 'telegram_url', 'twitter_url'] as $col) {
                if (trim((string) ($c[$col] ?? '')) !== '') {
                    $hasLink = true;
                    break;
                }
            }
        }
        $checks[] = $hasLink;
        if ($hasCommunity && !$hasLink) {
            $missing[] = 'liens';
        }

        $hasLogo = $c && trim((string) ($c['logo_url'] ?? '')) !== '';
        $checks[] = $hasLogo;
        if ($hasCommunity && !$hasLogo) {
            $missing[] = 'logo';
        }

        $done = count(array_filter($checks));
        $total = max(1, count($checks));
        $pct = (int) round(($done / $total) * 100);

        return [
            'pct' => $pct,
            'missing' => $missing !== [] ? implode(', ', $missing) : 'elements mineurs',
            'solution' => $c ? (string) $c['name'] : '',
        ];
    }

    private static function resolveLeadsPendingReview(PDO $db): array
    {
        $rows = $db->query(
            "SELECT u.id, u.name, u.email, c.name AS solution, c.id AS community_id
             FROM users u
             INNER JOIN communities c ON c.user_id = u.id AND c.status = 'pending'
             WHERE u.role = 'lead'
               AND u.email IS NOT NULL AND u.email <> ''
               AND u.email NOT LIKE '%@togosaas.invalid'
             ORDER BY c.created_at ASC"
        )->fetchAll();

        $byUser = [];
        foreach ($rows as $r) {
            $uid = (int) $r['id'];
            if (!isset($byUser[$uid])) {
                $byUser[$uid] = $r;
            }
        }

        return array_map(static fn($r) => [
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
            'user_id' => (int) $r['id'],
            'context' => [
                'solution' => (string) $r['solution'],
                'statut' => 'en attente de validation',
                'cta_url' => self::frontendUrl() . '/espace-lead',
            ],
        ], array_values($byUser));
    }

    private static function resolveLeadsWithSolution(PDO $db, bool $withEngagement): array
    {
        $rows = $db->query(
            "SELECT u.id, u.name, u.email, c.id AS community_id, c.name AS solution, c.slug
             FROM users u
             INNER JOIN communities c ON c.user_id = u.id AND c.status = 'approved'
             WHERE u.role = 'lead'
               AND u.email IS NOT NULL AND u.email <> ''
               AND u.email NOT LIKE '%@togosaas.invalid'
             ORDER BY u.name ASC"
        )->fetchAll();

        // Une ligne par lead (solution la plus recente si plusieurs).
        $byUser = [];
        foreach ($rows as $r) {
            $uid = (int) $r['id'];
            if (!isset($byUser[$uid])) {
                $byUser[$uid] = $r;
            }
        }

        $out = [];
        foreach ($byUser as $r) {
            $ctx = [
                'solution' => (string) $r['solution'],
                'cta_url' => self::frontendUrl() . '/espace-lead',
                'community_url' => self::frontendUrl() . '/solutions/' . rawurlencode((string) ($r['slug'] ?? $r['community_id'])),
            ];
            if ($withEngagement) {
                $stats = EngagementHelper::statsForCommunity((int) $r['community_id']);
                $likesWeek = self::countSince('community_likes', (int) $r['community_id'], 7);
                $reviewsWeek = self::countSince('community_reviews', (int) $r['community_id'], 7);
                $ctx['likes_count'] = (string) $stats['likesCount'];
                $ctx['reviews_count'] = (string) $stats['reviewsCount'];
                $ctx['rating_avg'] = $stats['ratingAvg'] !== null ? (string) $stats['ratingAvg'] : '—';
                $ctx['likes_week'] = (string) $likesWeek;
                $ctx['reviews_week'] = (string) $reviewsWeek;
            }
            $out[] = [
                'email' => (string) $r['email'],
                'name' => $r['name'] !== null ? (string) $r['name'] : null,
                'user_id' => (int) $r['id'],
                'context' => $ctx,
            ];
        }
        return $out;
    }

    private static function countSince(string $table, int $communityId, int $days): int
    {
        if (!in_array($table, ['community_likes', 'community_reviews'], true)) {
            return 0;
        }
        $stmt = Database::connection()->prepare(
            "SELECT COUNT(*) FROM {$table}
             WHERE community_id = :cid AND created_at >= (NOW() - INTERVAL {$days} DAY)"
        );
        $stmt->execute(['cid' => $communityId]);
        return (int) $stmt->fetchColumn();
    }

    private static function resolveLeadsDormant(PDO $db, int $weeks): array
    {
        $weeks = max(2, min(26, $weeks));
        $rows = $db->query(
            "SELECT u.id, u.name, u.email, c.name AS solution, c.slug, c.id AS community_id
             FROM users u
             INNER JOIN communities c ON c.user_id = u.id AND c.status = 'approved'
             WHERE u.role = 'lead'
               AND u.email IS NOT NULL AND u.email <> ''
               AND u.email NOT LIKE '%@togosaas.invalid'
               AND COALESCE(c.updated_at, c.created_at) <= (NOW() - INTERVAL {$weeks} WEEK)
             ORDER BY c.updated_at ASC"
        )->fetchAll();

        $byUser = [];
        foreach ($rows as $r) {
            $uid = (int) $r['id'];
            if (!isset($byUser[$uid])) {
                $byUser[$uid] = $r;
            }
        }

        return array_map(static fn($r) => [
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
            'user_id' => (int) $r['id'],
            'context' => [
                'solution' => (string) $r['solution'],
                'dormant_weeks' => (string) $weeks,
                'cta_url' => self::frontendUrl() . '/espace-lead',
            ],
        ], array_values($byUser));
    }

    private static function resolveLeadsStale(PDO $db, int $weeks): array
    {
        // Reutilise la logique dormante avec seuil plus long (rappel maj fiche).
        return self::resolveLeadsDormant($db, $weeks);
    }

    private static function resolveOnboardingDay(PDO $db, int $day): array
    {
        $day = max(1, min(30, $day));
        // Fenetre 24h autour du jour cible (ex. J3 = comptes crees il y a 3 jours).
        $rows = $db->query(
            self::leadBaseSql() . "
              AND DATE(u.created_at) = DATE(NOW() - INTERVAL {$day} DAY)
            ORDER BY u.id ASC"
        )->fetchAll();

        return array_map(static fn($r) => [
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
            'user_id' => (int) $r['id'],
            'context' => [
                'onboarding_day' => (string) $day,
                'cta_url' => self::frontendUrl() . ($day <= 3 ? '/espace-lead/communautes/nouvelle' : '/espace-lead'),
            ],
        ], $rows);
    }

    private static function resolveRecentlyApproved(PDO $db, int $withinDays): array
    {
        $withinDays = max(1, min(14, $withinDays));
        $rows = $db->query(
            "SELECT u.id, u.name, u.email, c.name AS solution, c.slug, c.id AS community_id
             FROM users u
             INNER JOIN communities c ON c.user_id = u.id AND c.status = 'approved'
             WHERE u.role = 'lead'
               AND u.email IS NOT NULL AND u.email <> ''
               AND u.email NOT LIKE '%@togosaas.invalid'
               AND COALESCE(c.updated_at, c.created_at) >= (NOW() - INTERVAL {$withinDays} DAY)
             ORDER BY c.updated_at DESC"
        )->fetchAll();

        $byUser = [];
        foreach ($rows as $r) {
            $uid = (int) $r['id'];
            if (!isset($byUser[$uid])) {
                $byUser[$uid] = $r;
            }
        }

        $base = self::frontendUrl();
        return array_map(static function ($r) use ($base) {
            $slug = (string) ($r['slug'] ?? $r['community_id']);
            $url = $base . '/solutions/' . rawurlencode($slug);
            $shareText = rawurlencode('Decouvrez ' . (string) $r['solution'] . ' sur TogoSaaS : ' . $url);
            return [
                'email' => (string) $r['email'],
                'name' => $r['name'] !== null ? (string) $r['name'] : null,
                'user_id' => (int) $r['id'],
                'context' => [
                    'solution' => (string) $r['solution'],
                    'community_url' => $url,
                    'share_linkedin' => 'https://www.linkedin.com/sharing/share-offsite/?url=' . rawurlencode($url),
                    'share_whatsapp' => 'https://wa.me/?text=' . $shareText,
                    'cta_url' => $url,
                ],
            ];
        }, array_values($byUser));
    }

    private static function resolveCategoryTag(PDO $db, array $config): array
    {
        $tag = strtolower(trim((string) ($config['tag'] ?? $config['category'] ?? '')));
        if ($tag === '') {
            return [];
        }

        $rows = $db->query(
            "SELECT u.id, u.name, u.email, c.name AS solution, c.tags, c.slug
             FROM users u
             INNER JOIN communities c ON c.user_id = u.id AND c.status IN ('approved', 'pending')
             WHERE u.role = 'lead'
               AND u.email IS NOT NULL AND u.email <> ''
               AND u.email NOT LIKE '%@togosaas.invalid'
             ORDER BY u.name ASC"
        )->fetchAll();

        $out = [];
        $seen = [];
        foreach ($rows as $r) {
            $uid = (int) $r['id'];
            if (isset($seen[$uid])) {
                continue;
            }
            $tags = json_decode((string) ($r['tags'] ?? '[]'), true);
            if (!is_array($tags)) {
                $tags = [];
            }
            $normalized = array_map(static fn($t) => strtolower(trim((string) $t)), $tags);
            if (!in_array($tag, $normalized, true)) {
                continue;
            }
            $seen[$uid] = true;
            $out[] = [
                'email' => (string) $r['email'],
                'name' => $r['name'] !== null ? (string) $r['name'] : null,
                'user_id' => $uid,
                'context' => [
                    'solution' => (string) $r['solution'],
                    'category' => $tag,
                    'cta_url' => self::frontendUrl() . '/espace-lead',
                ],
            ];
        }
        return $out;
    }

    private static function resolveAdminsDigest(PDO $db): array
    {
        $admins = $db->query(
            "SELECT id, name, email FROM users
             WHERE role IN ('admin', 'subadmin')
               AND email IS NOT NULL AND email <> ''
               AND email NOT LIKE '%@togosaas.invalid'
             ORDER BY FIELD(role, 'admin', 'subadmin'), name ASC"
        )->fetchAll();

        $newLeads = (int) $db->query(
            "SELECT COUNT(*) FROM users WHERE role = 'lead' AND created_at >= (NOW() - INTERVAL 7 DAY)"
        )->fetchColumn();
        $pendingSolutions = (int) $db->query(
            "SELECT COUNT(*) FROM communities WHERE status = 'pending'"
        )->fetchColumn();
        $pendingReports = (int) $db->query(
            "SELECT COUNT(*) FROM community_reports WHERE status IN ('pending', 'investigating')"
        )->fetchColumn();

        $flaggedReviews = 0;
        try {
            $flaggedReviews = (int) $db->query(
                "SELECT COUNT(*) FROM community_review_flags WHERE created_at >= (NOW() - INTERVAL 7 DAY)"
            )->fetchColumn();
        } catch (\Throwable $e) {
            try {
                $flaggedReviews = (int) $db->query(
                    "SELECT COUNT(*) FROM community_review_contents
                     WHERE status = 'flagged' AND updated_at >= (NOW() - INTERVAL 7 DAY)"
                )->fetchColumn();
            } catch (\Throwable $e2) {
                $flaggedReviews = 0;
            }
        }

        $failedMails = 0;
        try {
            $failedMails = (int) $db->query(
                "SELECT COUNT(*) FROM automation_logs
                 WHERE status = 'failed' AND created_at >= (NOW() - INTERVAL 7 DAY)"
            )->fetchColumn();
        } catch (\Throwable $e) {
            $failedMails = 0;
        }

        $ctx = [
            'new_leads_week' => (string) $newLeads,
            'pending_solutions' => (string) $pendingSolutions,
            'pending_reports' => (string) $pendingReports,
            'flagged_reviews' => (string) $flaggedReviews,
            'failed_mails_week' => (string) $failedMails,
            'cta_url' => self::frontendUrl() . '/espace-admin',
        ];

        return array_map(static fn($r) => [
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
            'user_id' => (int) $r['id'],
            'context' => $ctx,
        ], $admins);
    }

    private static function resolveCooldown(array $config, string $key): int
    {
        if (isset($config['cooldown_days'])) {
            return max(0, (int) $config['cooldown_days']);
        }
        return self::DEFAULT_COOLDOWNS[$key] ?? 7;
    }

    private static function wasRecentlyQueuedOrSent(int $automationId, ?int $userId, string $email, int $cooldownDays): bool
    {
        if ($cooldownDays <= 0) {
            return false;
        }

        $db = Database::connection();
        if ($userId !== null && $userId > 0) {
            $stmt = $db->prepare(
                "SELECT 1 FROM automation_logs
                 WHERE automation_id = :aid
                   AND user_id = :uid
                   AND status IN ('pending', 'sending', 'sent')
                   AND created_at >= (NOW() - INTERVAL {$cooldownDays} DAY)
                 LIMIT 1"
            );
            $stmt->execute(['aid' => $automationId, 'uid' => $userId]);
        } else {
            $stmt = $db->prepare(
                "SELECT 1 FROM automation_logs
                 WHERE automation_id = :aid
                   AND recipient_email = :email
                   AND status IN ('pending', 'sending', 'sent')
                   AND created_at >= (NOW() - INTERVAL {$cooldownDays} DAY)
                 LIMIT 1"
            );
            $stmt->execute(['aid' => $automationId, 'email' => $email]);
        }

        return (bool) $stmt->fetchColumn();
    }

    public static function isSentinelEmail(string $email): bool
    {
        $email = strtolower(trim($email));
        return $email === '' || str_ends_with($email, '@togosaas.invalid') || str_starts_with($email, 'incomplet.');
    }

    public static function frontendUrl(): string
    {
        $url = rtrim(trim((string) env('FRONTEND_URL', '')), '/');
        return $url !== '' ? $url : 'https://togosaas.vercel.app';
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
            $targetDow = max(1, min(7, (int) ($config['dayOfWeek'] ?? 1)));
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
