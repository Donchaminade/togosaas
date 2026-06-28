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

        $stats['userReview'] = self::userReview($communityId, $visitorId);

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

    /* --------------------------------------------------------------- */
    /* Avis ecrits (commentaires) + reponses editeur + moderation      */
    /* --------------------------------------------------------------- */

    private const MAX_TITLE = 160;
    private const MAX_COMMENT = 2000;
    private const MAX_AUTHOR = 120;

    /**
     * Enregistre une note ET un commentaire ecrit pour un visiteur.
     * Reutilise la table community_reviews pour la note ; le texte vit dans la
     * table additive community_review_contents (1:1 par review_id).
     *
     * @return array{ratingAvg:?float,reviewsCount:int,userRating:int}
     */
    public static function submitReview(
        int $communityId,
        string $visitorId,
        int $rating,
        ?string $title,
        string $comment,
        ?string $authorName
    ): array {
        $db = Database::connection();

        // 1) Note (logique existante).
        $stats = self::setReview($communityId, $visitorId, $rating);

        // 2) Identifiant de l'avis (note) du visiteur.
        $reviewId = self::reviewId($communityId, $visitorId);
        if ($reviewId === null) {
            return $stats;
        }

        // 3) Contenu redige (titre + texte), upsert sur review_id.
        $title = self::clean($title, self::MAX_TITLE);
        $comment = (string) self::clean($comment, self::MAX_COMMENT);
        $authorName = self::clean($authorName, self::MAX_AUTHOR);

        $db->prepare(
            'INSERT INTO community_review_contents
                (review_id, community_id, visitor_id, title, comment, author_name, status, created_at, updated_at)
             VALUES (:rid, :cid, :vid, :title, :comment, :author, \'visible\', NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                comment = VALUES(comment),
                author_name = VALUES(author_name),
                updated_at = NOW()'
        )->execute([
            'rid' => $reviewId,
            'cid' => $communityId,
            'vid' => $visitorId,
            'title' => $title,
            'comment' => $comment,
            'author' => $authorName,
        ]);

        return $stats;
    }

    /** Liste publique des avis ecrits visibles d'une solution (avec reponse editeur). */
    public static function listReviews(int $communityId): array
    {
        $db = Database::connection();
        $stmt = $db->prepare(
            "SELECT c.review_id, c.title, c.comment, c.author_name, c.created_at,
                    r.rating,
                    rep.body AS reply_body, rep.created_at AS reply_at
             FROM community_review_contents c
             INNER JOIN community_reviews r ON r.id = c.review_id
             LEFT JOIN community_review_replies rep ON rep.review_id = c.review_id
             WHERE c.community_id = :cid AND c.status = 'visible'
             ORDER BY c.created_at DESC"
        );
        $stmt->execute(['cid' => $communityId]);

        return array_map(static fn($row) => [
            'id' => (int) $row['review_id'],
            'rating' => (int) $row['rating'],
            'title' => $row['title'] !== null && $row['title'] !== '' ? $row['title'] : null,
            'comment' => (string) $row['comment'],
            'authorName' => $row['author_name'] !== null && $row['author_name'] !== '' ? $row['author_name'] : 'Visiteur',
            'createdAt' => $row['created_at'],
            'reply' => $row['reply_body'] !== null
                ? ['body' => (string) $row['reply_body'], 'createdAt' => $row['reply_at']]
                : null,
        ], $stmt->fetchAll());
    }

    /** Avis ecrit du visiteur courant (pour pre-remplir le formulaire). */
    public static function userReview(int $communityId, ?string $visitorId): ?array
    {
        if ($visitorId === null) {
            return null;
        }
        $db = Database::connection();
        $stmt = $db->prepare(
            "SELECT c.title, c.comment, c.status, r.rating
             FROM community_review_contents c
             INNER JOIN community_reviews r ON r.id = c.review_id
             WHERE c.community_id = :cid AND c.visitor_id = :vid LIMIT 1"
        );
        $stmt->execute(['cid' => $communityId, 'vid' => $visitorId]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        return [
            'rating' => (int) $row['rating'],
            'title' => $row['title'] ?? null,
            'comment' => (string) $row['comment'],
            'status' => $row['status'],
        ];
    }

    /** Signale un avis (un signalement par visiteur). @return bool true si nouveau. */
    public static function flagReview(int $reviewId, string $visitorId, ?string $reason): bool
    {
        $db = Database::connection();

        // L'avis (contenu) doit exister.
        $check = $db->prepare('SELECT 1 FROM community_review_contents WHERE review_id = :rid LIMIT 1');
        $check->execute(['rid' => $reviewId]);
        if (!$check->fetch()) {
            return false;
        }

        $stmt = $db->prepare(
            'INSERT IGNORE INTO community_review_flags (review_id, visitor_id, reason, created_at)
             VALUES (:rid, :vid, :reason, NOW())'
        );
        $stmt->execute([
            'rid' => $reviewId,
            'vid' => $visitorId,
            'reason' => self::clean($reason, 255),
        ]);

        if ($stmt->rowCount() > 0) {
            $db->prepare(
                'UPDATE community_review_contents SET flags_count = flags_count + 1 WHERE review_id = :rid'
            )->execute(['rid' => $reviewId]);
            return true;
        }
        return false;
    }

    /** Reponse de l'editeur a un avis (upsert : une reponse par avis). */
    public static function replyToReview(int $reviewId, int $communityId, int $userId, string $body): bool
    {
        $body = (string) self::clean($body, self::MAX_COMMENT);
        if ($body === '') {
            return false;
        }
        $db = Database::connection();

        // L'avis doit appartenir a la solution.
        $check = $db->prepare('SELECT 1 FROM community_reviews WHERE id = :rid AND community_id = :cid LIMIT 1');
        $check->execute(['rid' => $reviewId, 'cid' => $communityId]);
        if (!$check->fetch()) {
            return false;
        }

        $db->prepare(
            'INSERT INTO community_review_replies (review_id, community_id, user_id, body, created_at, updated_at)
             VALUES (:rid, :cid, :uid, :body, NOW(), NOW())
             ON DUPLICATE KEY UPDATE body = VALUES(body), user_id = VALUES(user_id), updated_at = NOW()'
        )->execute(['rid' => $reviewId, 'cid' => $communityId, 'uid' => $userId, 'body' => $body]);

        return true;
    }

    /** Liste des avis pour la moderation admin (tous statuts, signales d'abord). */
    public static function adminListReviews(bool $onlyFlagged = false): array
    {
        $db = Database::connection();
        $where = $onlyFlagged ? 'WHERE c.flags_count > 0' : '';
        $stmt = $db->query(
            "SELECT c.review_id, c.title, c.comment, c.author_name, c.status, c.flags_count,
                    c.created_at, r.rating, r.community_id,
                    com.name AS community_name, com.slug AS community_slug
             FROM community_review_contents c
             INNER JOIN community_reviews r ON r.id = c.review_id
             INNER JOIN communities com ON com.id = c.community_id
             $where
             ORDER BY (c.flags_count > 0) DESC, c.created_at DESC
             LIMIT 300"
        );

        return array_map(static fn($row) => [
            'id' => (int) $row['review_id'],
            'communityId' => (int) $row['community_id'],
            'communityName' => $row['community_name'],
            'communitySlug' => $row['community_slug'] ?? null,
            'rating' => (int) $row['rating'],
            'title' => $row['title'] ?? null,
            'comment' => (string) $row['comment'],
            'authorName' => $row['author_name'] ?? 'Visiteur',
            'status' => $row['status'],
            'flagsCount' => (int) $row['flags_count'],
            'createdAt' => $row['created_at'],
        ], $stmt->fetchAll());
    }

    /** Admin : masque ou reaffiche un avis ecrit. */
    public static function setReviewStatus(int $reviewId, string $status): bool
    {
        if (!in_array($status, ['visible', 'hidden'], true)) {
            return false;
        }
        $stmt = Database::connection()->prepare(
            'UPDATE community_review_contents SET status = :status, updated_at = NOW() WHERE review_id = :rid'
        );
        $stmt->execute(['status' => $status, 'rid' => $reviewId]);
        return $stmt->rowCount() >= 0;
    }

    /** Admin : supprime le commentaire ecrit (la note en etoile est conservee). */
    public static function deleteReviewContent(int $reviewId): bool
    {
        Database::connection()
            ->prepare('DELETE FROM community_review_contents WHERE review_id = :rid')
            ->execute(['rid' => $reviewId]);
        Database::connection()
            ->prepare('DELETE FROM community_review_replies WHERE review_id = :rid')
            ->execute(['rid' => $reviewId]);
        return true;
    }

    /** Identifiant de la ligne community_reviews d'un visiteur. */
    private static function reviewId(int $communityId, string $visitorId): ?int
    {
        $stmt = Database::connection()->prepare(
            'SELECT id FROM community_reviews WHERE community_id = :cid AND visitor_id = :vid LIMIT 1'
        );
        $stmt->execute(['cid' => $communityId, 'vid' => $visitorId]);
        $id = $stmt->fetchColumn();
        return $id !== false ? (int) $id : null;
    }

    /** Nettoie une chaine libre : retire le HTML, normalise, tronque. */
    private static function clean(?string $value, int $max): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim(strip_tags($value));
        if ($value === '') {
            return null;
        }
        return mb_substr($value, 0, $max);
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
