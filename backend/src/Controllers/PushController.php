<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Auth;
use TCH\Database;
use TCH\Request;
use TCH\Response;
use TCH\WebPush;

/**
 * Abonnements aux notifications Web Push.
 *
 * L'abonnement est possible meme sans etre connecte (user_id NULL) ; s'il y a
 * un utilisateur authentifie, l'abonnement lui est rattache pour permettre le
 * ciblage (messages admin, automatisations...).
 */
final class PushController
{
    /** Configuration publique : cle VAPID publique + disponibilite serveur. */
    public function config(Request $request): void
    {
        Response::success([
            'enabled' => WebPush::isConfigured(),
            'publicKey' => env('VAPID_PUBLIC_KEY') ?: null,
        ]);
    }

    /** Enregistre (ou met a jour) un abonnement push. */
    public function subscribe(Request $request): void
    {
        $user = Auth::user(); // facultatif : l'abonnement anonyme est autorise.

        $subscription = $request->input('subscription');
        if (!is_array($subscription)) {
            $subscription = $request->all();
        }

        $endpoint = trim((string) ($subscription['endpoint'] ?? ''));
        $keys = is_array($subscription['keys'] ?? null) ? $subscription['keys'] : [];
        $p256dh = trim((string) ($keys['p256dh'] ?? $subscription['p256dh'] ?? ''));
        $auth = trim((string) ($keys['auth'] ?? $subscription['auth'] ?? ''));

        if (
            $endpoint === ''
            || !filter_var($endpoint, FILTER_VALIDATE_URL)
            || strlen($endpoint) > 2000
            || $p256dh === ''
            || $auth === ''
            || strlen($p256dh) > 255
            || strlen($auth) > 255
        ) {
            Response::error('Abonnement push invalide.', 422);
        }

        $hash = hash('sha256', $endpoint);
        $userAgent = mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
        $userId = $user !== null ? (int) $user['id'] : null;

        // Upsert sur l'empreinte du endpoint (unique).
        Database::connection()->prepare(
            'INSERT INTO push_subscriptions (user_id, endpoint, endpoint_hash, p256dh, auth, user_agent, created_at)
             VALUES (:uid, :endpoint, :hash, :p256dh, :auth, :ua, NOW())
             ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id),
                p256dh = VALUES(p256dh),
                auth = VALUES(auth),
                user_agent = VALUES(user_agent),
                updated_at = NOW()'
        )->execute([
            'uid' => $userId,
            'endpoint' => $endpoint,
            'hash' => $hash,
            'p256dh' => $p256dh,
            'auth' => $auth,
            'ua' => $userAgent,
        ]);

        Response::success(['subscribed' => true], 'Notifications activees.', 201);
    }

    /** Supprime un abonnement push. */
    public function unsubscribe(Request $request): void
    {
        $subscription = $request->input('subscription');
        if (!is_array($subscription)) {
            $subscription = $request->all();
        }
        $endpoint = trim((string) ($subscription['endpoint'] ?? ''));

        if ($endpoint === '') {
            Response::error('Endpoint manquant.', 422);
        }

        $hash = hash('sha256', $endpoint);
        Database::connection()
            ->prepare('DELETE FROM push_subscriptions WHERE endpoint_hash = :hash')
            ->execute(['hash' => $hash]);

        Response::success(['subscribed' => false], 'Notifications desactivees.');
    }
}
