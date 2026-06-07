<?php

declare(strict_types=1);

namespace TCH;

final class EventHelper
{
    public static function listForCommunity(int $communityId, bool $upcomingOnly = false): array
    {
        $sql = 'SELECT * FROM community_events WHERE community_id = :cid';
        if ($upcomingOnly) {
            $sql .= ' AND starts_at >= NOW()';
        }
        $sql .= ' ORDER BY starts_at ASC';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute(['cid' => $communityId]);

        return array_map([self::class, 'serialize'], $stmt->fetchAll());
    }

    public static function serialize(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'communityId' => (int) $row['community_id'],
            'title' => $row['title'],
            'description' => $row['description'] ?? null,
            'startsAt' => self::formatDateTime($row['starts_at']),
            'endsAt' => isset($row['ends_at']) ? self::formatDateTime($row['ends_at']) : null,
            'location' => $row['location'] ?? null,
            'eventUrl' => $row['event_url'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    public static function columnsFromRequest(Request $request): array
    {
        return [
            'title' => trim((string) $request->input('title')),
            'description' => self::nullableString($request->input('description')),
            'starts_at' => self::normalizeDateTime($request->input('startsAt')),
            'ends_at' => self::nullableDateTime($request->input('endsAt')),
            'location' => self::nullableString($request->input('location')),
            'event_url' => self::nullableString($request->input('eventUrl')),
        ];
    }

    public static function find(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM community_events WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    /** @return array{community: array, user: array, role: string} */
    public static function requireCommunityOwner(int $communityId): array
    {
        return CommunityAccessHelper::requireMember($communityId);
    }

    private static function formatDateTime(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return date('c', strtotime($value));
    }

    private static function normalizeDateTime($value): string
    {
        $ts = strtotime((string) $value);
        if ($ts === false) {
            Response::error('Date de debut invalide.', 422);
        }
        return date('Y-m-d H:i:s', $ts);
    }

    private static function nullableDateTime($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $ts = strtotime((string) $value);
        if ($ts === false) {
            Response::error('Date de fin invalide.', 422);
        }
        return date('Y-m-d H:i:s', $ts);
    }

    private static function nullableString($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return trim((string) $value);
    }
}
