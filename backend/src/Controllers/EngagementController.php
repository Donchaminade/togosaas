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
        ])->abortIfFails();

        $visitorId = $this->requireVisitorId($request);
        $rating = (int) $request->input('rating');
        $result = EngagementHelper::setReview($communityId, $visitorId, $rating);

        Response::success(['engagement' => $result], 'Merci pour votre avis !');
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
