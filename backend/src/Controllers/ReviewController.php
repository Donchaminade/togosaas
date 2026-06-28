<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\CommunityAccessHelper;
use TCH\EngagementHelper;
use TCH\Request;
use TCH\Response;
use TCH\Validator;

/**
 * Reponses des editeurs aux avis et moderation des avis cote admin.
 */
final class ReviewController
{
    /** L'editeur (proprietaire / co-lead) repond a un avis sur sa solution. */
    public function leadReply(Request $request): void
    {
        $user = Auth::requireUser();
        $communityId = (int) $request->param('id');

        // Verifie que l'utilisateur est bien membre (proprietaire/co-lead/admin) de la solution.
        CommunityAccessHelper::requireMember($communityId);

        Validator::make($request->all())->validate([
            'body' => 'required|min:1|max:2000',
        ])->abortIfFails();

        $reviewId = (int) $request->param('reviewId');
        $ok = EngagementHelper::replyToReview(
            $reviewId,
            $communityId,
            (int) $user['id'],
            (string) $request->input('body')
        );

        if (!$ok) {
            Response::error('Avis introuvable pour cette solution.', 404);
        }

        Response::success(['replied' => true], 'Votre reponse a ete publiee.');
    }

    /** Admin : liste des avis (option ?flagged=1 pour les signales). */
    public function adminIndex(Request $request): void
    {
        Auth::requireAdmin();
        $onlyFlagged = filter_var($request->query('flagged'), FILTER_VALIDATE_BOOLEAN);
        Response::success(['reviews' => EngagementHelper::adminListReviews($onlyFlagged)]);
    }

    /** Admin : masque ou reaffiche un avis. */
    public function adminUpdate(Request $request): void
    {
        Auth::requireAdmin();
        $reviewId = (int) $request->param('id');

        Validator::make($request->all())->validate([
            'status' => 'required|in:visible,hidden',
        ])->abortIfFails();

        $status = (string) $request->input('status');
        EngagementHelper::setReviewStatus($reviewId, $status);

        Response::success(
            ['id' => $reviewId, 'status' => $status],
            $status === 'hidden' ? 'Avis masque.' : 'Avis de nouveau visible.'
        );
    }

    /** Admin : supprime definitivement le commentaire d'un avis (suppression reservee au super-admin). */
    public function adminDestroy(Request $request): void
    {
        Auth::requireSuperAdmin();
        $reviewId = (int) $request->param('id');
        EngagementHelper::deleteReviewContent($reviewId);
        Response::success(null, 'Avis supprime.');
    }
}
