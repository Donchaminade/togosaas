<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Database;
use TCH\EngagementHelper;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

final class EngagementController
{
    public function show(Request $request): void
    {
        $communityId = $this->resolveApprovedCommunityId($request);
        if ($communityId === null) {
            Response::error('Communaute introuvable.', 404);
        }

        $visitorId = EngagementHelper::normalizeVisitorId(
            (string) ($request->query('visitorId') ?: $request->input('visitorId'))
        );

        Response::success([
            'engagement' => EngagementHelper::snapshot($communityId, $visitorId),
        ]);
    }

    public function toggleLike(Request $request): void
    {
        $communityId = $this->resolveApprovedCommunityId($request);
        if ($communityId === null) {
            Response::error('Communaute introuvable.', 404);
        }

        $visitorId = $this->requireVisitorId($request);
        $result = EngagementHelper::toggleLike($communityId, $visitorId);

        Response::success(['engagement' => $result], $result['liked'] ? 'Merci pour votre soutien !' : 'Like retire.');
    }

    public function review(Request $request): void
    {
        $communityId = $this->resolveApprovedCommunityId($request);
        if ($communityId === null) {
            Response::error('Communaute introuvable.', 404);
        }

        Validator::make($request->all())->validate([
            'rating' => 'required|in:1,2,3,4,5',
            'title' => 'max:160',
            'comment' => 'max:2000',
            'authorName' => 'max:120',
        ])->abortIfFails();

        $visitorId = $this->requireVisitorId($request);
        $rating = (int) $request->input('rating');

        $comment = trim((string) ($request->input('comment') ?? ''));

        if ($comment !== '') {
            // Avis ecrit complet : note + commentaire (+ titre / nom facultatifs).
            $result = EngagementHelper::submitReview(
                $communityId,
                $visitorId,
                $rating,
                self::nullable($request->input('title')),
                $comment,
                self::nullable($request->input('authorName'))
            );
            Response::success(['engagement' => $result], 'Merci pour votre avis !');
        }

        // Note seule (clic sur les etoiles).
        $result = EngagementHelper::setReview($communityId, $visitorId, $rating);
        Response::success(['engagement' => $result], 'Merci pour votre note !');
    }

    /** Liste publique des avis ecrits d'une solution. */
    public function reviews(Request $request): void
    {
        $communityId = $this->resolveApprovedCommunityId($request);
        if ($communityId === null) {
            Response::error('Communaute introuvable.', 404);
        }

        Response::success(['reviews' => EngagementHelper::listReviews($communityId)]);
    }

    /** Signalement d'un avis par un visiteur (moderation). */
    public function flagReview(Request $request): void
    {
        $communityId = $this->resolveApprovedCommunityId($request);
        if ($communityId === null) {
            Response::error('Communaute introuvable.', 404);
        }

        $reviewId = (int) $request->param('reviewId');
        $visitorId = $this->requireVisitorId($request);
        $reason = $request->input('reason') !== null ? (string) $request->input('reason') : null;

        $created = EngagementHelper::flagReview($reviewId, $visitorId, $reason);

        Response::success(
            ['flagged' => true],
            $created ? 'Avis signale. Merci, notre equipe va le verifier.' : 'Cet avis a deja ete signale.'
        );
    }

    private static function nullable($value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim((string) $value);
        return $value === '' ? null : $value;
    }

    private function requireVisitorId(Request $request): string
    {
        $visitorId = EngagementHelper::normalizeVisitorId((string) $request->input('visitorId'));
        if ($visitorId === null) {
            Response::error('Identifiant visiteur invalide.', 422);
        }
        return $visitorId;
    }

    private function resolveApprovedCommunityId(Request $request): ?int
    {
        $identifier = (string) $request->param('id');
        $db = Database::connection();

        if (ctype_digit($identifier)) {
            $stmt = $db->prepare(
                "SELECT id FROM communities WHERE id = :id AND status = 'approved' LIMIT 1"
            );
            $stmt->execute(['id' => (int) $identifier]);
        } else {
            $stmt = $db->prepare(
                "SELECT id FROM communities WHERE slug = :slug AND status = 'approved' LIMIT 1"
            );
            $stmt->execute(['slug' => $identifier]);
        }

        $row = $stmt->fetch();
        return $row ? (int) $row['id'] : null;
    }
}
