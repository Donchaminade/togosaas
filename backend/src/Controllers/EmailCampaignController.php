<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\Database;
use TCH\EmailAttachmentHelper;
use TCH\Mailer;
use TCH\Notifier;
use TCH\RateLimiter;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

/**
 * Campagnes email : redaction et envoi par l'admin vers les leads,
 * avec pieces jointes, historique et suivi par destinataire.
 */
final class EmailCampaignController
{
    private const MAX_RECIPIENTS = 1000;

    /** Etat de la configuration SMTP (pour activer/desactiver l'UI). */
    public function config(Request $request): void
    {
        Auth::requireAdmin();

        $configured = Mailer::isConfigured();
        $from = null;
        if ($configured) {
            $from = (new Mailer())->fromAddress();
        }

        Response::success([
            'configured' => $configured,
            'fromEmail' => $from,
            'maxFiles' => EmailAttachmentHelper::MAX_FILES,
        ]);
    }

    /** Liste des leads disponibles comme destinataires. */
    public function recipients(Request $request): void
    {
        Auth::requireAdmin();

        $rows = Database::connection()->query(
            "SELECT id, name, email FROM users WHERE role = 'lead' AND email IS NOT NULL AND email <> '' AND email NOT LIKE '%@togosaas.invalid' ORDER BY name ASC"
        )->fetchAll();

        $recipients = array_map(static fn($r) => [
            'id' => (int) $r['id'],
            'name' => $r['name'],
            'email' => $r['email'],
        ], $rows);

        Response::success(['recipients' => $recipients, 'total' => count($recipients)]);
    }

    /** Upload d'une piece jointe (stockee temporairement avant envoi). */
    public function uploadAttachment(Request $request): void
    {
        Auth::requireAdmin();

        if (!isset($_FILES['file'])) {
            Response::error('Fichier manquant.', 422);
        }

        Response::success(
            ['attachment' => EmailAttachmentHelper::store($_FILES['file'])],
            'Fichier pret.',
            201
        );
    }

    /** Cree et envoie une campagne. */
    public function store(Request $request): void
    {
        $admin = Auth::requireAdmin();

        if (!Mailer::isConfigured()) {
            Response::error('Le service d\'envoi d\'email n\'est pas configure (SMTP). Renseignez les variables MAIL_* du serveur.', 503);
        }

        RateLimiter::enforce('email-campaign', 20, 3600);

        Validator::make($request->all())->validate([
            'subject' => 'required|min:2|max:255',
            'bodyHtml' => 'required|min:1',
        ])->abortIfFails();

        $subject = trim((string) $request->input('subject'));
        $bodyHtml = self::sanitizeHtml((string) $request->input('bodyHtml'));

        if (trim(strip_tags($bodyHtml)) === '' && !str_contains($bodyHtml, '<img')) {
            Response::error('Le corps du message est vide.', 422);
        }

        $attachments = EmailAttachmentHelper::validateKeys($request->input('attachments'));

        $recipients = self::resolveRecipients($request);
        if ($recipients === []) {
            Response::error('Aucun destinataire valide.', 422);
        }
        if (count($recipients) > self::MAX_RECIPIENTS) {
            Response::error('Trop de destinataires (max ' . self::MAX_RECIPIENTS . ').', 422);
        }

        $db = Database::connection();
        $db->prepare(
            'INSERT INTO email_campaigns (subject, body_html, attachments, sender_id, recipients_count, status, created_at)
             VALUES (:subject, :body, :attachments, :sender, :count, :status, NOW())'
        )->execute([
            'subject' => $subject,
            'body' => $bodyHtml,
            'attachments' => $attachments === [] ? null : json_encode($attachments, JSON_UNESCAPED_UNICODE),
            'sender' => (int) $admin['id'],
            'count' => count($recipients),
            'status' => 'sending',
        ]);
        $campaignId = (int) $db->lastInsertId();

        $insertRecipient = $db->prepare(
            'INSERT INTO email_campaign_recipients (campaign_id, user_id, email, name, status)
             VALUES (:cid, :uid, :email, :name, :status)'
        );
        foreach ($recipients as $r) {
            $insertRecipient->execute([
                'cid' => $campaignId,
                'uid' => $r['id'],
                'email' => $r['email'],
                'name' => $r['name'],
                'status' => 'pending',
            ]);
        }

        $stats = self::dispatch($campaignId, $recipients, $subject, $bodyHtml, $attachments);

        // Notification push non bloquante aux leads destinataires (diffusion admin).
        $recipientIds = array_values(array_filter(array_map(
            static fn($r) => isset($r['id']) ? (int) $r['id'] : 0,
            $recipients
        )));
        if ($recipientIds !== []) {
            Notifier::push(
                $recipientIds,
                $subject !== '' ? $subject : 'Nouveau message de TogoSaaS',
                'Vous avez recu un nouveau message de TogoSaaS.',
                '/espace-lead'
            );
        }

        Response::success(
            ['campaign' => self::serializeCampaign(self::findCampaign($campaignId))],
            'Campagne envoyee : ' . $stats['sent'] . ' reussi(s), ' . $stats['failed'] . ' echec(s).',
            201
        );
    }

    /** Historique des campagnes. */
    public function index(Request $request): void
    {
        Auth::requireAdmin();

        $rows = Database::connection()->query(
            'SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 100'
        )->fetchAll();

        Response::success([
            'campaigns' => array_map([self::class, 'serializeCampaign'], $rows),
        ]);
    }

    /** Detail d'une campagne avec ses destinataires. */
    public function show(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');
        $campaign = self::findCampaign($id);
        if ($campaign === null) {
            Response::error('Campagne introuvable.', 404);
        }

        $stmt = Database::connection()->prepare(
            'SELECT * FROM email_campaign_recipients WHERE campaign_id = :cid ORDER BY status ASC, name ASC'
        );
        $stmt->execute(['cid' => $id]);

        Response::success([
            'campaign' => self::serializeCampaign($campaign),
            'recipients' => array_map([self::class, 'serializeRecipient'], $stmt->fetchAll()),
        ]);
    }

    /** Renvoie uniquement les destinataires en echec. */
    public function retry(Request $request): void
    {
        Auth::requireAdmin();

        if (!Mailer::isConfigured()) {
            Response::error('Le service d\'envoi d\'email n\'est pas configure (SMTP).', 503);
        }

        $id = (int) $request->param('id');
        $campaign = self::findCampaign($id);
        if ($campaign === null) {
            Response::error('Campagne introuvable.', 404);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            "SELECT * FROM email_campaign_recipients WHERE campaign_id = :cid AND status = 'failed'"
        );
        $stmt->execute(['cid' => $id]);
        $rows = $stmt->fetchAll();

        if ($rows === []) {
            Response::error('Aucun destinataire en echec a renvoyer.', 422);
        }

        $recipients = array_map(static fn($r) => [
            'id' => $r['user_id'] !== null ? (int) $r['user_id'] : null,
            'email' => $r['email'],
            'name' => $r['name'],
            'recipientId' => (int) $r['id'],
        ], $rows);

        $attachments = EmailAttachmentHelper::decodeList($campaign['attachments'] ?? null);
        self::dispatch($id, $recipients, (string) $campaign['subject'], (string) $campaign['body_html'], $attachments, true);

        Response::success(
            ['campaign' => self::serializeCampaign(self::findCampaign($id))],
            'Renvoi effectue.'
        );
    }

    /* --------------------------------------------------------------- */
    /* Logique interne                                                 */
    /* --------------------------------------------------------------- */

    /**
     * Envoie les emails et met a jour les statuts par destinataire + la campagne.
     *
     * @param list<array{id: ?int, email: string, name: ?string, recipientId?: int}> $recipients
     * @param list<array{key: string, originalName: string, mime: string}> $attachments
     * @return array{sent: int, failed: int}
     */
    private static function dispatch(int $campaignId, array $recipients, string $subject, string $bodyHtml, array $attachments, bool $isRetry = false): array
    {
        @set_time_limit(0);
        ignore_user_abort(true);

        $db = Database::connection();
        $mailerAttachments = EmailAttachmentHelper::toMailerAttachments($attachments);

        $updateByRecipientId = $db->prepare(
            'UPDATE email_campaign_recipients SET status = :status, error = :error, sent_at = :sent_at WHERE id = :id'
        );
        $updateByCampaignEmail = $db->prepare(
            'UPDATE email_campaign_recipients SET status = :status, error = :error, sent_at = :sent_at
             WHERE campaign_id = :cid AND email = :email'
        );

        $mailer = new Mailer();
        $results = $mailer->sendBulk($recipients, $subject, $bodyHtml, $mailerAttachments);

        foreach ($recipients as $r) {
            $email = strtolower(trim((string) $r['email']));
            $result = $results[$email] ?? ['ok' => false, 'error' => 'Non traite.', 'detail' => 'Non traite.'];
            $status = $result['ok'] ? 'sent' : 'failed';
            // Colonne error reservee au suivi admin : on conserve le vrai detail SMTP
            // (email mal saisi, refus serveur...) meme quand APP_DEBUG=false.
            $error = $result['ok'] ? null : mb_substr((string) ($result['detail'] ?? $result['error'] ?? ''), 0, 480);
            $sentAt = $result['ok'] ? date('Y-m-d H:i:s') : null;

            if (isset($r['recipientId'])) {
                $updateByRecipientId->execute([
                    'status' => $status,
                    'error' => $error,
                    'sent_at' => $sentAt,
                    'id' => (int) $r['recipientId'],
                ]);
            } else {
                $updateByCampaignEmail->execute([
                    'status' => $status,
                    'error' => $error,
                    'sent_at' => $sentAt,
                    'cid' => $campaignId,
                    'email' => $r['email'],
                ]);
            }
        }

        // Recalcule les totaux a partir de la table des destinataires.
        $countStmt = $db->prepare(
            "SELECT
                SUM(status = 'sent') AS sent,
                SUM(status = 'failed') AS failed,
                COUNT(*) AS total
             FROM email_campaign_recipients WHERE campaign_id = :cid"
        );
        $countStmt->execute(['cid' => $campaignId]);
        $counts = $countStmt->fetch();

        $sent = (int) ($counts['sent'] ?? 0);
        $failed = (int) ($counts['failed'] ?? 0);
        $total = (int) ($counts['total'] ?? 0);

        $status = 'sent';
        if ($sent === 0) {
            $status = 'failed';
        } elseif ($failed > 0) {
            $status = 'partial';
        }

        $db->prepare(
            'UPDATE email_campaigns SET sent_count = :sent, failed_count = :failed, recipients_count = :total, status = :status WHERE id = :id'
        )->execute([
            'sent' => $sent,
            'failed' => $failed,
            'total' => $total,
            'status' => $status,
            'id' => $campaignId,
        ]);

        return ['sent' => $sent, 'failed' => $failed];
    }

    /**
     * Resout la liste des leads destinataires (tous ou selection).
     *
     * @return list<array{id: int, email: string, name: ?string}>
     */
    private static function resolveRecipients(Request $request): array
    {
        $all = filter_var($request->input('all'), FILTER_VALIDATE_BOOLEAN);
        $userIds = $request->input('userIds');
        $db = Database::connection();

        if ($all) {
            $rows = $db->query(
                "SELECT id, name, email FROM users WHERE role = 'lead' AND email IS NOT NULL AND email <> '' AND email NOT LIKE '%@togosaas.invalid' ORDER BY name ASC"
            )->fetchAll();
        } else {
            if (!is_array($userIds) || $userIds === []) {
                Response::error('Selectionnez au moins un destinataire ou activez l\'envoi a tous.', 422);
            }

            $ids = array_values(array_unique(array_filter(array_map(static fn($id) => (int) $id, $userIds))));
            if ($ids === []) {
                Response::error('Selectionnez au moins un destinataire valide.', 422);
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare(
                "SELECT id, name, email FROM users WHERE role = 'lead' AND email IS NOT NULL AND email <> '' AND email NOT LIKE '%@togosaas.invalid' AND id IN ($placeholders)"
            );
            $stmt->execute($ids);
            $rows = $stmt->fetchAll();
        }

        return array_map(static fn($r) => [
            'id' => (int) $r['id'],
            'email' => (string) $r['email'],
            'name' => $r['name'] !== null ? (string) $r['name'] : null,
        ], $rows);
    }

    /**
     * Nettoie le HTML fourni par l'admin : retire scripts, styles, iframes,
     * gestionnaires d'evenements et URLs javascript:.
     */
    private static function sanitizeHtml(string $html): string
    {
        $html = preg_replace('#<\s*(script|style|iframe|object|embed|form)\b[^>]*>.*?<\s*/\s*\1\s*>#is', '', $html) ?? $html;
        $html = preg_replace('#<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*>#is', '', $html) ?? $html;
        // Retire les attributs evenementiels on*="..." / on*='...'
        $html = preg_replace('#\son\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)#is', '', $html) ?? $html;
        // Neutralise les URLs javascript:
        $html = preg_replace('#(href|src)\s*=\s*("|\')\s*javascript:[^"\']*\2#is', '$1=$2#$2', $html) ?? $html;

        return trim($html);
    }

    private static function findCampaign(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM email_campaigns WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private static function serializeCampaign(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'subject' => $row['subject'],
            'bodyHtml' => $row['body_html'],
            'attachments' => EmailAttachmentHelper::decodeList($row['attachments'] ?? null),
            'recipientsCount' => (int) $row['recipients_count'],
            'sentCount' => (int) $row['sent_count'],
            'failedCount' => (int) $row['failed_count'],
            'status' => $row['status'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    private static function serializeRecipient(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'userId' => $row['user_id'] !== null ? (int) $row['user_id'] : null,
            'email' => $row['email'],
            'name' => $row['name'],
            'status' => $row['status'],
            'error' => $row['error'],
            'sentAt' => $row['sent_at'] ?? null,
        ];
    }
}
