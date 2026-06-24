<?php

declare(strict_types=1);

namespace TCH;

use PDO;

/**
 * Gestion de l'authentification et des autorisations basees sur le JWT.
 */
final class Auth
{
    /**
     * Recupere l'utilisateur courant a partir du header Authorization.
     * @return array|null Donnees utilisateur (depuis la BDD) ou null.
     */
    public static function user(): ?array
    {
        $token = self::bearerToken();
        if ($token === null) {
            return null;
        }

        $payload = Jwt::decode($token);
        if ($payload === null || !isset($payload['sub'])) {
            return null;
        }

        $stmt = Database::connection()->prepare(
            'SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => (int) $payload['sub']]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * Exige un utilisateur authentifie, sinon repond 401.
     */
    public static function requireUser(): array
    {
        $user = self::user();
        if ($user === null) {
            Response::error('Authentification requise.', 401);
        }
        return $user;
    }

    /**
     * Exige un membre du staff (admin OU subadmin), sinon repond 403.
     * Couvre l'acces general a l'espace d'administration et a la moderation.
     */
    public static function requireAdmin(): array
    {
        $user = self::requireUser();
        if (!in_array($user['role'] ?? '', ['admin', 'subadmin'], true)) {
            Response::error('Acces reserve aux administrateurs.', 403);
        }
        return $user;
    }

    /**
     * Exige un super-administrateur (role admin uniquement), sinon repond 403.
     * Reserve aux actions sensibles : gestion des comptes du staff, edition de
     * la page A propos et suppressions definitives.
     */
    public static function requireSuperAdmin(): array
    {
        $user = self::requireUser();
        if (($user['role'] ?? '') !== 'admin') {
            Response::error('Action reservee au super-administrateur.', 403);
        }
        return $user;
    }

    private static function bearerToken(): ?string
    {
        $header = self::authorizationHeader();
        if ($header === null) {
            return null;
        }
        if (preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    private static function authorizationHeader(): ?string
    {
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $key => $value) {
                if (strcasecmp($key, 'Authorization') === 0) {
                    return $value;
                }
            }
        }
        return null;
    }
}
