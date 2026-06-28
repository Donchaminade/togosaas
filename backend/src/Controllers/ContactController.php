<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\Database;
use TCH\Mailer;
use TCH\RateLimiter;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class ContactController
{
    public function store(Request $request): void
    {
        RateLimiter::enforce('contact', 5, 600); // 5 messages / 10 min / IP

        Validator::make($request->all())->validate([
            'name' => 'required|min:2|max:120',
            'email' => 'required|email|max:160',
            'subject' => 'max:200',
            'message' => 'required|min:10|max:3000',
        ])->abortIfFails();

        $stmt = Database::connection()->prepare(
            'INSERT INTO contact_messages (name, email, subject, message, is_read, created_at)
             VALUES (:name, :email, :subject, :message, 0, NOW())'
        );
        $stmt->execute([
            'name' => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
            'subject' => $request->input('subject') ? trim((string) $request->input('subject')) : 'Sans objet',
            'message' => trim((string) $request->input('message')),
        ]);

        Response::success(null, 'Merci ! Votre message a bien ete envoye.', 201);
    }

    /**
     * Admin : message d'origine + fil des reponses (ordre chronologique).
     */
    public function adminReplies(Request $request): void
    {
        Auth::requireAdmin();
        $id = (int) $request->param('id');

        $message = self::findMessage($id);
        if ($message === null) {
            Response::error('Message introuvable.', 404);
        }

        $stmt = Database::connection()->prepare(
            'SELECT * FROM contact_replies WHERE contact_message_id = :id ORDER BY created_at ASC, id ASC'
        );
        $stmt->execute(['id' => $id]);

        Response::success([
            'message' => self::serializeMessage($message),
            'replies' => array_map([self::class, 'serializeReply'], $stmt->fetchAll()),
        ]);
    }

    /**
     * Admin : enregistre une reponse, l'envoie par email au visiteur et
     * marque le message comme lu. Le statut "repondu" est deduit (>= 1 reponse).
     */
    public function adminReply(Request $request): void
    {
        $admin = Auth::requireAdmin();
        $id = (int) $request->param('id');

        Validator::make($request->all())->validate([
            'body' => 'required|min:1|max:3000',
        ])->abortIfFails();

        $message = self::findMessage($id);
        if ($message === null) {
            Response::error('Message introuvable.', 404);
        }

        $body = trim((string) $request->input('body'));
        $db = Database::connection();

        $db->prepare(
            'INSERT INTO contact_replies (contact_message_id, admin_id, body, email_status, created_at)
             VALUES (:mid, :aid, :body, :status, NOW())'
        )->execute([
            'mid' => $id,
            'aid' => (int) ($admin['id'] ?? 0) ?: null,
            'body' => $body,
            'status' => 'pending',
        ]);
        $replyId = (int) $db->lastInsertId();

        // Envoi de l'email au visiteur (expediteur du message d'origine).
        $emailStatus = 'failed';
        $warning = null;

        if (!Mailer::isConfigured()) {
            $warning = 'Reponse enregistree mais NON envoyee : la messagerie (SMTP) n\'est pas configuree.';
        } else {
            $subject = (string) ($message['subject'] ?? '');
            $subject = $subject !== '' ? $subject : 'Sans objet';
            $mailSubject = 'Re: ' . $subject;
            $html = self::buildReplyEmail(
                (string) ($message['name'] ?? ''),
                $body,
                (string) ($message['message'] ?? '')
            );

            $result = (new Mailer())->send(
                (string) ($message['email'] ?? ''),
                (string) ($message['name'] ?? ''),
                $mailSubject,
                $html
            );

            if (!empty($result['ok'])) {
                $emailStatus = 'sent';
            } else {
                $warning = 'Reponse enregistree mais l\'envoi de l\'email a echoue. '
                    . 'Verifiez l\'adresse du destinataire ou la configuration SMTP.';
            }
        }

        $db->prepare('UPDATE contact_replies SET email_status = :status WHERE id = :id')
            ->execute(['status' => $emailStatus, 'id' => $replyId]);

        // Marque le message comme lu (action de traitement par l'admin).
        $db->prepare('UPDATE contact_messages SET is_read = 1 WHERE id = :id')
            ->execute(['id' => $id]);

        $reply = $db->query('SELECT * FROM contact_replies WHERE id = ' . $replyId)->fetch();

        Response::success(
            ['reply' => self::serializeReply($reply)],
            $emailStatus === 'sent' ? 'Reponse envoyee au visiteur par email.' : ($warning ?? 'Reponse enregistree.'),
            201
        );
    }

    /** @return array<string, mixed>|null */
    private static function findMessage(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM contact_messages WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private static function serializeMessage(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'subject' => $row['subject'],
            'message' => $row['message'],
            'isRead' => (bool) $row['is_read'],
            'createdAt' => $row['created_at'],
        ];
    }

    private static function serializeReply(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'body' => $row['body'],
            'emailStatus' => (string) $row['email_status'],
            'createdAt' => $row['created_at'],
        ];
    }

    /**
     * Construit le corps HTML de l'email de reponse adresse au visiteur,
     * avec un rappel discret du message d'origine.
     */
    private static function buildReplyEmail(string $name, string $body, string $original): string
    {
        $greeting = trim($name) !== ''
            ? 'Bonjour ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ','
            : 'Bonjour,';
        $bodyHtml = nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8'));
        $originalHtml = nl2br(htmlspecialchars($original, ENT_QUOTES, 'UTF-8'));
        $site = htmlspecialchars((string) env('APP_NAME', 'TogoSaaS'), ENT_QUOTES, 'UTF-8');

        return <<<HTML
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;">
  <p>{$greeting}</p>
  <p>Vous nous avez contactes via notre formulaire. Voici notre reponse :</p>
  <div style="border-left:4px solid #1f8a4c;background:#f0fdf4;padding:12px 16px;border-radius:8px;margin:16px 0;">
    {$bodyHtml}
  </div>
  <div style="border-left:3px solid #e2e8f0;color:#64748b;font-size:13px;padding:8px 14px;margin:20px 0;">
    <p style="margin:0 0 6px;font-weight:bold;">Votre message d'origine :</p>
    {$originalHtml}
  </div>
  <p style="margin-top:24px;">Cordialement,<br/>L'equipe {$site}</p>
</div>
HTML;
    }
}
