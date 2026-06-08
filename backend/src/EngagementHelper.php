<?php

declare(strict_types=1);

namespace TCH;

final class EngagementHelper
{
    private const VISITOR_PATTERN = '/^[a-f0-9]{32,64}$/i';

    public static function normalizeVisitorId(?string $value): ?string
    {
        $id = strtolower(trim((string) $value));
        if ($id === '' || !preg_match(self::VISITOR_PATTERN, $id)) {
            return null;
        }
        return $id;
    }

    /** @return array{likesCount:int,ratingAvg:?float,reviewsCount:int} */
    public static function statsForCommunity(int $communityId): array
    {
        $map = self::statsForCommunityIds([$communityId]);
        return $map[$communityId] ?? self::emptyStats();
    }

    /**
     * @param int[] $communityIds
     * @return array<int, array{likesCount:int,ratingAvg:?float,reviewsCount:int}>
     */
    public static function statsForCommunityIds(array $communityIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $communityIds))));
        if ($ids === []) {
            return [];
        }

        $db = Database::connection();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        $likesStmt = $db->prepare(
            "SELECT community_id, COUNT(*) AS cnt FROM community_likes
             WHERE community_id IN ($placeholders) GROUP BY community_id"
        );
        $likesStmt->execute($ids);
        $likesMap = [];
        foreach ($likesStmt->fetchAll() as $row) {
            $likesMap[(int) $row['community_id']] = (int) $row['cnt'];
        }

        $reviewsStmt = $db->prepare(
            "SELECT community_id, COUNT(*) AS cnt, AVG(rating) AS avg_rating
             FROM community_reviews
             WHERE community_id IN ($placeholders)
             GROUP BY community_id"
        );
        $reviewsStmt->execute($ids);
        $reviewsMap = [];
        foreach ($reviewsStmt->fetchAll() as $row) {
            $reviewsMap[(int) $row['community_id']] = [
                'count' => (int) $row['cnt'],
                'avg' => $row['avg_rating'] !== null ? round((float) $row['avg_rating'], 1) : null,
            ];
        }

        $out = [];
        foreach ($ids as $id) {
            $reviews = $reviewsMap[$id] ?? ['count' => 0, 'avg' => null];
            $out[$id] = [
                'likesCount' => $likesMap[$id] ?? 0,
                'ratingAvg' => $reviews['avg'],
                'reviewsCount' => $reviews['count'],
            ];
        }

        return $out;
    }

    /** @return array{likesCount:int,ratingAvg:?float,reviewsCount:int,liked:bool,userRating:?int} */
    public static function snapshot(int $communityId, ?string $visitorId): array
    {
        $stats = self::statsForCommunity($communityId);
        $stats['liked'] = false;
        $stats['userRating'] = null;

        if ($visitorId !== null) {
            $db = Database::connection();
            $likeStmt = $db->prepare(
                'SELECT 1 FROM community_likes WHERE community_id = :cid AND visitor_id = :vid LIMIT 1'
            );
            $likeStmt->execute(['cid' => $communityId, 'vid' => $visitorId]);
            $stats['liked'] = (bool) $likeStmt->fetch();

            $reviewStmt = $db->prepare(
                'SELECT rating FROM community_reviews WHERE community_id = :cid AND visitor_id = :vid LIMIT 1'
            );
            $reviewStmt->execute(['cid' => $communityId, 'vid' => $visitorId]);
            $review = $reviewStmt->fetch();
            if ($review) {
                $stats['userRating'] = (int) $review['rating'];
            }
        }

        return $stats;
    }

    /** @return array{likesCount:int,liked:bool} */
    public static function toggleLike(int $communityId, string $visitorId): array
    {
        $db = Database::connection();

        $exists = $db->prepare(
            'SELECT id FROM community_likes WHERE community_id = :cid AND visitor_id = :vid LIMIT 1'
        );
        $exists->execute(['cid' => $communityId, 'vid' => $visitorId]);
        $row = $exists->fetch();

        if ($row) {
            $db->prepare('DELETE FROM community_likes WHERE id = :id')->execute(['id' => (int) $row['id']]);
            $liked = false;
        } else {
            $db->prepare(
                'INSERT INTO community_likes (community_id, visitor_id, created_at) VALUES (:cid, :vid, NOW())'
            )->execute(['cid' => $communityId, 'vid' => $visitorId]);
            $liked = true;
        }

        $countStmt = $db->prepare('SELECT COUNT(*) FROM community_likes WHERE community_id = :cid');
        $countStmt->execute(['cid' => $communityId]);

        return [
            'likesCount' => (int) $countStmt->fetchColumn(),
            'liked' => $liked,
        ];
    }

    /** @return array{ratingAvg:?float,reviewsCount:int,userRating:int} */
    public static function setReview(int $communityId, string $visitorId, int $rating): array
    {
        $db = Database::connection();

        $db->prepare(
            'INSERT INTO community_reviews (community_id, visitor_id, rating, created_at, updated_at)
             VALUES (:cid, :vid, :rating, NOW(), NOW())
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = NOW()'
        )->execute([
            'cid' => $communityId,
            'vid' => $visitorId,
            'rating' => $rating,
        ]);

        $stats = $db->prepare(
            'SELECT COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM community_reviews WHERE community_id = :cid'
        );
        $stats->execute(['cid' => $communityId]);
        $row = $stats->fetch() ?: ['cnt' => 0, 'avg_rating' => null];

        return [
            'ratingAvg' => $row['avg_rating'] !== null ? round((float) $row['avg_rating'], 1) : null,
            'reviewsCount' => (int) $row['cnt'],
            'userRating' => $rating,
        ];
    }

    public static function mergeStatsIntoCommunity(array $community): array
    {
        if (!isset($community['id'])) {
            return $community;
        }
        return array_merge($community, self::statsForCommunity((int) $community['id']));
    }

    /** @return array{likesCount:int,ratingAvg:?float,reviewsCount:int} */
    private static function emptyStats(): array
    {
        return [
            'likesCount' => 0,
            'ratingAvg' => null,
            'reviewsCount' => 0,
        ];
    }
}
