<?php

declare(strict_types=1);

namespace TCH;

use PDO;

/**
 * Aide reutilisable pour declencher des notifications Web Push.
 *
 * Conception NON BLOQUANTE : `push()` ne fait qu'empiler la demande puis
 * programme l'envoi reel APRES la reponse HTTP (fastcgi_finish_request),
 * exactement comme AutomationEngine pour les emails. Toute erreur est
 * absorbee : un echec d'envoi ne doit JAMAIS casser la requete hote.
 *
 * Si les cles VAPID ne sont pas configurees, tout devient un no-op silencieux.
 */
final class Notifier
{
    /** @var list<array{target:int|int[]|string|null,title:string,body:string,url:string}> */
    private static array $queue = [];

    private static bool $registered = false;

    /**
     * Programme l'envoi d'une notification push.
     *
     * @param int|int[]|string|null $target  id utilisateur, liste d'ids,
     *                                        'all' (ou null) pour tous les abonnes.
     */
    public static function push($target, string $title, string $body, string $url = '/'): void
    {
        try {
            if (!WebPush::isConfigured()) {
                return;
            }
            if ($title === '' && $body === '') {
                return;
            }
            self::$queue[] = [
                'target' => $target,
                'title' => mb_substr($title, 0, 120),
                'body' => mb_substr($body, 0, 300),
                'url' => $url !== '' ? $url : '/',
            ];
            self::scheduleFlush();
        } catch (\Throwable $e) {
            self::logError('push', $e);
        }
    }

    private static function scheduleFlush(): void
    {
        if (self::$registered) {
            return;
        }
        self::$registered = true;

        register_shutdown_function(static function (): void {
            try {
                if (function_exists('fastcgi_finish_request')) {
                    @fastcgi_finish_request();
                }
                @set_time_limit(0);
                ignore_user_abort(true);
                self::flush();
            } catch (\Throwable $e) {
                self::logError('shutdown', $e);
            }
        });
    }

    /** Vide la file et envoie reellement les notifications. */
    public static function flush(): void
    {
        $items = self::$queue;
        self::$queue = [];

        foreach ($items as $item) {
            try {
                self::deliver($item['target'], $item['title'], $item['body'], $item['url']);
            } catch (\Throwable $e) {
                self::logError('deliver', $e);
            }
        }
    }

    /**
     * @param int|int[]|string|null $target
     */
    private static function deliver($target, string $title, string $body, string $url): void
    {
        $subscriptions = self::resolveSubscriptions($target);
        if ($subscriptions === []) {
            return;
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'url' => $url,
        ], JSON_UNESCAPED_UNICODE);
        if ($payload === false) {
            return;
        }

        $expiredIds = [];
        foreach ($subscriptions as $sub) {
            $result = WebPush::send([
                'endpoint' => (string) $sub['endpoint'],
                'p256dh' => (string) $sub['p256dh'],
                'auth' => (string) $sub['auth'],
            ], $payload);

            if (!$result['ok'] && $result['expired']) {
                $expiredIds[] = (int) $sub['id'];
            }
        }

        if ($expiredIds !== []) {
            self::purgeExpired($expiredIds);
        }
    }

    /**
     * @param int|int[]|string|null $target
     * @return list<array{id:int,endpoint:string,p256dh:string,auth:string}>
     */
    private static function resolveSubscriptions($target): array
    {
        $db = Database::connection();

        if (is_int($target)) {
            $stmt = $db->prepare(
                'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = :uid'
            );
            $stmt->execute(['uid' => $target]);
        } elseif (is_array($target)) {
            $ids = array_values(array_unique(array_filter(array_map('intval', $target))));
            if ($ids === []) {
                return [];
            }
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare(
                "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id IN ($placeholders)"
            );
            $stmt->execute($ids);
        } else {
            // 'all' ou null : tous les abonnes.
            $stmt = $db->query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions');
        }

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /** @param list<int> $ids */
    private static function purgeExpired(array $ids): void
    {
        try {
            $db = Database::connection();
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            // Suppression de lignes d'abonnements EXPIRES uniquement (404/410).
            // Operation de donnees normale sur notre table dediee : non destructive
            // du schema, ne touche a aucune autre table.
            $db->prepare("DELETE FROM push_subscriptions WHERE id IN ($placeholders)")->execute($ids);
        } catch (\Throwable $e) {
            self::logError('purgeExpired', $e);
        }
    }

    private static function logError(string $where, \Throwable $e): void
    {
        if (TCH_DEBUG) {
            error_log("[Notifier::{$where}] " . $e->getMessage());
        }
    }
}
