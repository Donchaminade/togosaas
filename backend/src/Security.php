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
        header('X-XSS-Protection: 1; mode=block');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    }

    /** Origine autorisee depuis FRONTEND_URL (jamais de wildcard). */
    public static function allowedOrigin(): ?string
    {
        $url = rtrim(trim((string) env('FRONTEND_URL', '')), '/');

        return $url !== '' && $url !== '*' ? $url : null;
    }

    public static function applyCors(): void
    {
        $allowed = self::allowedOrigin();
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($allowed !== null && $origin !== '' && rtrim($origin, '/') === $allowed) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override');
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
