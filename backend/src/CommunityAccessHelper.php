<?php

declare(strict_types=1);

namespace TCH;

final class CommunityAccessHelper
{
    public const CO_LEAD_ALLOWED = [
        'description',
        'short_description',
        'mission',
        'tags',
        'whatsapp_url',
        'telegram_url',
        'linkedin_url',
        'twitter_url',
        'website_url',
        'gallery',
        'founded_year',
        'member_count',
        'meeting_info',
        'public_email',
    ];

    /** @return array{community: array, user: array, role: 'owner'|'co_lead'|'admin'} */
    public static function requireMember(int $communityId, bool $ownerOnly = false): array
    {
        $user = Auth::requireUser();
        $stmt = Database::connection()->prepare(
            'SELECT * FROM communities WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $communityId]);
        $community = $stmt->fetch();

        if (!$community) {
            Response::error('Communaute introuvable.', 404);
        }

        $isAdmin = ($user['role'] ?? '') === 'admin';
        if ($isAdmin) {
            return ['community' => $community, 'user' => $user, 'role' => 'admin'];
        }

        $isOwner = (int) $community['user_id'] === (int) $user['id'];
        if ($isOwner) {
            return ['community' => $community, 'user' => $user, 'role' => 'owner'];
        }

        if ($ownerOnly) {
            Response::error('Action reservee au responsable principal.', 403);
        }

        $memberStmt = Database::connection()->prepare(
            'SELECT role FROM community_members WHERE community_id = :cid AND user_id = :uid LIMIT 1'
        );
        $memberStmt->execute(['cid' => $communityId, 'uid' => (int) $user['id']]);
        $member = $memberStmt->fetch();

        if (!$member || ($member['role'] ?? '') !== 'co_lead') {
            Response::error('Acces refuse.', 403);
        }

        return ['community' => $community, 'user' => $user, 'role' => 'co_lead'];
    }

    public static function getMembershipRole(int $communityId, int $userId, bool $isAdmin = false): ?string
    {
        if ($isAdmin) {
            return 'admin';
        }

        $stmt = Database::connection()->prepare(
            'SELECT user_id FROM communities WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $communityId]);
        $row = $stmt->fetch();
        if ($row && (int) $row['user_id'] === $userId) {
            return 'owner';
        }

        $memberStmt = Database::connection()->prepare(
            'SELECT role FROM community_members WHERE community_id = :cid AND user_id = :uid LIMIT 1'
        );
        $memberStmt->execute(['cid' => $communityId, 'uid' => $userId]);
        $member = $memberStmt->fetch();

        return $member ? (string) $member['role'] : null;
    }

    public static function filterColumnsForCoLead(array $cols): array
    {
        return array_intersect_key($cols, array_flip(self::CO_LEAD_ALLOWED));
    }

    /** @param array<int, array<string, mixed>> $coLeads */
    public static function syncCoLeadMembers(int $communityId, array $coLeads): void
    {
        $db = Database::connection();
        $emails = [];
        foreach ($coLeads as $cl) {
            if (!is_array($cl)) {
                continue;
            }
            $email = strtolower(trim((string) ($cl['email'] ?? '')));
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $emails[] = $email;
            }
        }
        $emails = array_values(array_unique($emails));

        $db->prepare(
            'DELETE FROM community_members WHERE community_id = :cid AND role = \'co_lead\''
        )->execute(['cid' => $communityId]);

        if ($emails === []) {
            return;
        }

        $ownerStmt = $db->prepare('SELECT user_id FROM communities WHERE id = :id LIMIT 1');
        $ownerStmt->execute(['id' => $communityId]);
        $ownerId = (int) ($ownerStmt->fetch()['user_id'] ?? 0);

        $insert = $db->prepare(
            'INSERT INTO community_members (community_id, user_id, role) VALUES (:cid, :uid, \'co_lead\')'
        );

        foreach ($emails as $email) {
            $userStmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $userStmt->execute(['email' => $email]);
            $userRow = $userStmt->fetch();
            if (!$userRow) {
                continue;
            }
            $uid = (int) $userRow['id'];
            if ($uid === $ownerId) {
                continue;
            }
            $insert->execute(['cid' => $communityId, 'uid' => $uid]);
        }
    }
}
