<?php

declare(strict_types=1);

namespace TCH;

/**
 * Headers HTTP, CORS strict et messages d'erreur sans fuite d'informations internes.
 */
final class Security
{
    public static function applyHeaders(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

        // HSTS : seulement utile/sain en HTTPS (evite de pieger le HTTP local).
        if (self::isHttps()) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    }

    /** Detecte une requete HTTPS (y compris derriere le proxy Hostinger). */
    private static function isHttps(): bool
    {
        if (($_SERVER['HTTPS'] ?? '') !== '' && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
            return true;
        }
        if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
            return true;
        }
        return ((int) ($_SERVER['SERVER_PORT'] ?? 0)) === 443;
    }

    /**
     * Liste des origines autorisees pour le CORS (jamais de wildcard).
     * Accepte FRONTEND_URL (origine unique) et FRONTEND_URLS (liste separee par des virgules),
     * ce qui permet par ex. un frontend Vercel + un domaine custom.
     *
     * @return string[]
     */
    public static function allowedOrigins(): array
    {
        $raw = trim((string) env('FRONTEND_URL', '')) . ',' . trim((string) env('FRONTEND_URLS', ''));

        $origins = [];
        foreach (explode(',', $raw) as $url) {
            $url = rtrim(trim($url), '/');
            if ($url !== '' && $url !== '*') {
                $origins[$url] = true; // dedoublonnage
            }
        }

        return array_keys($origins);
    }

    public static function applyCors(): void
    {
        $allowed = self::allowedOrigins();
        $origin = rtrim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''), '/');

        if ($origin !== '' && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override');
        header('Access-Control-Max-Age: 86400');
    }

    public static function registerErrorHandlers(): void
    {
        set_exception_handler(static function (\Throwable $e): void {
            error_log($e->getMessage());
            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                self::applyHeaders();
            }
            $msg = TCH_DEBUG ? $e->getMessage() : 'Une erreur interne est survenue.';
            echo json_encode(['success' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE);
            exit;
        });
    }

    /** Masque les messages techniques en production (SQL, tables, stack traces). */
    public static function publicMessage(string $message): string
    {
        if (TCH_DEBUG) {
            return $message;
        }

        if (preg_match(
            '/SQLSTATE|PDO|mysql|Table|Column|Duplicate|foreign key|constraint|syntax error|Stack trace|Unknown column/i',
            $message
        )) {
            return 'Une erreur interne est survenue.';
        }

        return $message;
    }
}
