<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\Database;
use TCH\Request;
use TCH\Response;
use TCH\SupportAttachmentHelper;
use TCH\Validator;

final class SupportController
{
    /** Fil de discussion du lead connecte. */
    public function leadMessages(Request $request): void
    {
        $user = Auth::requireUser();
        if (($user['role'] ?? '') === 'admin') {
            Response::error('Utilisez l\'espace admin.', 403);
        }

        $stmt = Database::connection()->prepare(
            'SELECT * FROM support_messages WHERE user_id = :uid ORDER BY created_at ASC'
        );
        $stmt->execute(['uid' => (int) $user['id']]);

        Database::connection()->prepare(
            'UPDATE support_messages SET is_read = 1 WHERE user_id = :uid AND sender_role = \'admin\' AND is_read = 0'
        )->execute(['uid' => (int) $user['id']]);

        Response::success(['messages' => array_map([self::class, 'serialize'], $stmt->fetchAll())]);
    }

    public function leadSend(Request $request): void
    {
        $user = Auth::requireUser();
        if (($user['role'] ?? '') === 'admin') {
            Response::error('Utilisez l\'espace admin.', 403);
        }

        $body = trim((string) $request->input('body'));
        $attachments = SupportAttachmentHelper::validateKeys($request->input('attachments'));

        if ($body === '' && $attachments === []) {
            Response::error('Saisissez un message ou joignez un fichier.', 422);
        }

        if ($body !== '') {
            Validator::make(['body' => $body])->validate([
                'body' => 'required|min:1|max:3000',
            ])->abortIfFails();
        }

        $row = self::insertMessage((int) $user['id'], 'lead', $body, $attachments);
        Response::success(['message' => self::serialize($row)], 'Message envoye.', 201);
    }

    public function leadUploadAttachment(Request $request): void
    {
        $user = Auth::requireUser();
        if (($user['role'] ?? '') === 'admin') {
            Response::error('Utilisez l\'espace admin.', 403);
        }

        if (!isset($_FILES['file'])) {
            Response::error('Fichier manquant.', 422);
        }

        Response::success(['attachment' => SupportAttachmentHelper::store($_FILES['file'])], 'Fichier pret.', 201);
    }

    public function leadDownloadAttachment(Request $request): void
    {
        $user = Auth::requireUser();
        if (($user['role'] ?? '') === 'admin') {
            Response::error('Utilisez l\'espace admin.', 403);
        }

        self::streamAttachment(
            (int) $request->param('messageId'),
            (int) $request->param('index'),
            (int) $user['id'],
            null
        );
    }

    public function leadUpdateMessage(Request $request): void
    {
        $user = Auth::requireUser();
        if (($user['role'] ?? '') === 'admin') {
            Response::error('Utilisez l\'espace admin.', 403);
        }

        $row = self::updateMessage(
            (int) $request->param('messageId'),
            (int) $user['id'],
            'lead',
            trim((string) $request->input('body'))
        );

        Response::success(['message' => self::serialize($row)], 'Message modifie.');
    }

    public function leadDeleteMessage(Request $request): void
    {
        $user = Auth::requireUser();
        if (($user['role'] ?? '') === 'admin') {
            Response::error('Utilisez l\'espace admin.', 403);
        }

        $row = self::deleteMessage((int) $request->param('messageId'), (int) $user['id'], 'lead');
        Response::success(['message' => self::serialize($row)], 'Message supprime.');
    }

    public function leadUnread(Request $request): void
    {
        $user = Auth::requireUser();
        $stmt = Database::connection()->prepare(
            'SELECT COUNT(*) FROM support_messages WHERE user_id = :uid AND sender_role = \'admin\' AND is_read = 0'
        );
        $stmt->execute(['uid' => (int) $user['id']]);
        Response::success(['unread' => (int) $stmt->fetchColumn()]);
    }

    /** Conversations lead (admin). */
    public function adminConversations(Request $request): void
    {
        Auth::requireAdmin();
        $db = Database::connection();
        $rows = $db->query(
            'SELECT u.id, u.name, u.email,
                    (SELECT body FROM support_messages sm WHERE sm.user_id = u.id ORDER BY sm.created_at DESC LIMIT 1) AS last_body,
                    (SELECT created_at FROM support_messages sm WHERE sm.user_id = u.id ORDER BY sm.created_at DESC LIMIT 1) AS last_at,
                    (SELECT COUNT(*) FROM support_messages sm WHERE sm.user_id = u.id AND sm.sender_role = \'lead\' AND sm.is_read = 0) AS unread
             FROM users u
             WHERE u.role = \'lead\'
               AND EXISTS (SELECT 1 FROM support_messages sm WHERE sm.user_id = u.id)
             ORDER BY last_at DESC'
        )->fetchAll();

        $conversations = array_map(static fn($r) => [
            'userId' => (int) $r['id'],
            'name' => $r['name'],
            'email' => $r['email'],
            'lastBody' => $r['last_body'],
            'lastAt' => $r['last_at'],
            'unread' => (int) $r['unread'],
        ], $rows);

        Response::success(['conversations' => $conversations]);
    }

    public function adminThread(Request $request): void
    {
        Auth::requireAdmin();
        $userId = (int) $request->param('userId');

        $db = Database::connection();
        $stmt = $db->prepare(
            'SELECT * FROM support_messages WHERE user_id = :uid ORDER BY created_at ASC'
        );
        $stmt->execute(['uid' => $userId]);

        $db->prepare(
            'UPDATE support_messages SET is_read = 1 WHERE user_id = :uid AND sender_role = \'lead\' AND is_read = 0'
        )->execute(['uid' => $userId]);

        $userStmt = $db->prepare('SELECT id, name, email FROM users WHERE id = :id LIMIT 1');
        $userStmt->execute(['id' => $userId]);
        $lead = $userStmt->fetch();

        Response::success([
            'lead' => $lead ? ['id' => (int) $lead['id'], 'name' => $lead['name'], 'email' => $lead['email']] : null,
            'messages' => array_map([self::class, 'serialize'], $stmt->fetchAll()),
        ]);
    }

    public function adminSend(Request $request): void
    {
        Auth::requireAdmin();
        $userId = (int) $request->param('userId');

        $body = trim((string) $request->input('body'));
        $attachments = SupportAttachmentHelper::validateKeys($request->input('attachments'));

        if ($body === '' && $attachments === []) {
            Response::error('Saisissez un message ou joignez un fichier.', 422);
        }

        if ($body !== '') {
            Validator::make(['body' => $body])->validate([
                'body' => 'required|min:1|max:3000',
            ])->abortIfFails();
        }

        $db = Database::connection();
        $check = $db->prepare('SELECT id FROM users WHERE id = :id AND role = \'lead\' LIMIT 1');
        $check->execute(['id' => $userId]);
        if (!$check->fetch()) {
            Response::error('Lead introuvable.', 404);
        }

        $row = self::insertMessage($userId, 'admin', $body, $attachments);
        Response::success(['message' => self::serialize($row)], 'Reponse envoyee.', 201);
    }

    public function adminUploadAttachment(Request $request): void
    {
        Auth::requireAdmin();

        if (!isset($_FILES['file'])) {
            Response::error('Fichier manquant.', 422);
        }

        Response::success(['attachment' => SupportAttachmentHelper::store($_FILES['file'])], 'Fichier pret.', 201);
    }

    public function adminDownloadAttachment(Request $request): void
    {
        Auth::requireAdmin();

        self::streamAttachment(
            (int) $request->param('messageId'),
            (int) $request->param('index'),
            null,
            true
        );
    }

    public function adminUpdateMessage(Request $request): void
    {
        Auth::requireAdmin();

        $row = self::updateMessage(
            (int) $request->param('messageId'),
            null,
            'admin',
            trim((string) $request->input('body'))
        );

        Response::success(['message' => self::serialize($row)], 'Message modifie.');
    }

    public function adminDeleteMessage(Request $request): void
    {
        Auth::requireAdmin();

        $row = self::deleteMessage((int) $request->param('messageId'), null, 'admin');
        Response::success(['message' => self::serialize($row)], 'Message supprime.');
    }

    /** Message admin a tous les leads ou a une selection. */
    public function adminBroadcast(Request $request): void
    {
        Auth::requireAdmin();

        Validator::make($request->all())->validate([
            'body' => 'required|min:1|max:3000',
        ])->abortIfFails();

        $body = trim((string) $request->input('body'));
        $all = filter_var($request->input('all'), FILTER_VALIDATE_BOOLEAN);
        $userIds = $request->input('userIds');

        $db = Database::connection();

        if ($all) {
            $rows = $db->query("SELECT id FROM users WHERE role = 'lead' ORDER BY name ASC")->fetchAll();
            $targetIds = array_map(static fn($r) => (int) $r['id'], $rows);
        } else {
            if (!is_array($userIds) || $userIds === []) {
                Response::error('Selectionnez au moins un lead ou activez l\'envoi a tous.', 422);
            }

            $targetIds = array_values(array_unique(array_map(static fn($id) => (int) $id, $userIds)));
            if ($targetIds === []) {
                Response::error('Selectionnez au moins un lead ou activez l\'envoi a tous.', 422);
            }

            $placeholders = implode(',', array_fill(0, count($targetIds), '?'));
            $stmt = $db->prepare("SELECT id FROM users WHERE role = 'lead' AND id IN ($placeholders)");
            $stmt->execute($targetIds);
            $validIds = array_map(static fn($r) => (int) $r['id'], $stmt->fetchAll());

            if (count($validIds) !== count($targetIds)) {
                Response::error('Un ou plusieurs destinataires sont invalides.', 422);
            }

            $targetIds = $validIds;
        }

        if ($targetIds === []) {
            Response::error('Aucun lead inscrit.', 404);
        }

        foreach ($targetIds as $uid) {
            self::insertMessage($uid, 'admin', $body, []);
        }

        Response::success([
            'sent' => count($targetIds),
            'userIds' => $targetIds,
        ], 'Message envoye a ' . count($targetIds) . ' lead(s).', 201);
    }

    /** @param list<array{key: string, originalName: string, mime: string, size?: int}> $attachments */
    private static function insertMessage(int $userId, string $role, string $body, array $attachments): array
    {
        $db = Database::connection();
        $json = $attachments === [] ? null : json_encode($attachments, JSON_UNESCAPED_UNICODE);

        $db->prepare(
            'INSERT INTO support_messages (user_id, sender_role, body, attachments, is_read, created_at)
             VALUES (:uid, :role, :body, :attachments, 0, NOW())'
        )->execute([
            'uid' => $userId,
            'role' => $role,
            'body' => $body,
            'attachments' => $json,
        ]);

        return $db->query('SELECT * FROM support_messages WHERE id = ' . (int) $db->lastInsertId())->fetch();
    }

    private static function findOwnedMessage(int $messageId, ?int $leadUserId, string $senderRole): array
    {
        $db = Database::connection();
        $stmt = $db->prepare('SELECT * FROM support_messages WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $messageId]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Message introuvable.', 404);
        }

        if (($row['sender_role'] ?? '') !== $senderRole) {
            Response::error('Vous ne pouvez modifier que vos propres messages.', 403);
        }

        if ($leadUserId !== null && (int) $row['user_id'] !== $leadUserId) {
            Response::error('Acces refuse.', 403);
        }

        if (!empty($row['deleted_at'])) {
            Response::error('Ce message a deja ete supprime.', 410);
        }

        return $row;
    }

    private static function updateMessage(int $messageId, ?int $leadUserId, string $senderRole, string $body): array
    {
        $row = self::findOwnedMessage($messageId, $leadUserId, $senderRole);
        $attachments = SupportAttachmentHelper::decodeList($row['attachments'] ?? null);

        if ($body === '' && $attachments === []) {
            Response::error('Le message ne peut pas etre vide.', 422);
        }

        if ($body !== '') {
            Validator::make(['body' => $body])->validate([
                'body' => 'required|min:1|max:3000',
            ])->abortIfFails();
        }

        $db = Database::connection();
        $db->prepare(
            'UPDATE support_messages SET body = :body, updated_at = NOW() WHERE id = :id'
        )->execute([
            'body' => $body,
            'id' => $messageId,
        ]);

        return $db->query('SELECT * FROM support_messages WHERE id = ' . $messageId)->fetch();
    }

    private static function deleteMessage(int $messageId, ?int $leadUserId, string $senderRole): array
    {
        $row = self::findOwnedMessage($messageId, $leadUserId, $senderRole);
        $attachments = SupportAttachmentHelper::decodeList($row['attachments'] ?? null);
        SupportAttachmentHelper::deleteList($attachments);

        $db = Database::connection();
        $db->prepare(
            'UPDATE support_messages SET body = \'\', attachments = NULL, deleted_at = NOW(), updated_at = NOW() WHERE id = :id'
        )->execute(['id' => $messageId]);

        return $db->query('SELECT * FROM support_messages WHERE id = ' . $messageId)->fetch();
    }

    private static function streamAttachment(int $messageId, int $index, ?int $leadUserId, ?bool $admin): void
    {
        $db = Database::connection();
        $stmt = $db->prepare('SELECT * FROM support_messages WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $messageId]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Message introuvable.', 404);
        }

        if ($admin) {
            Auth::requireAdmin();
        } else {
            if ($leadUserId === null || (int) $row['user_id'] !== $leadUserId) {
                Response::error('Acces refuse.', 403);
            }
        }

        $attachments = SupportAttachmentHelper::decodeList($row['attachments'] ?? null);
        if (!isset($attachments[$index])) {
            Response::error('Piece jointe introuvable.', 404);
        }

        $item = $attachments[$index];
        $path = SupportAttachmentHelper::resolvePath((string) ($item['key'] ?? ''));
        if (!$path) {
            Response::error('Fichier introuvable.', 404);
        }

        $mime = (string) ($item['mime'] ?? 'application/octet-stream');
        $name = (string) ($item['originalName'] ?? 'fichier');

        header('Content-Type: ' . $mime);
        header('Content-Disposition: inline; filename="' . str_replace('"', '', $name) . '"');
        header('Content-Length: ' . (string) filesize($path));
        readfile($path);
        exit;
    }

    public static function serialize(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'userId' => (int) $row['user_id'],
            'senderRole' => $row['sender_role'],
            'body' => $row['body'],
            'attachments' => SupportAttachmentHelper::decodeList($row['attachments'] ?? null),
            'isRead' => (bool) $row['is_read'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'] ?? null,
            'deletedAt' => $row['deleted_at'] ?? null,
        ];
    }
}
