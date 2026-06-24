<?php

declare(strict_types=1);

namespace TCH;

/**
 * Limiteur de debit minimaliste (par IP + cle d'action), base sur des fichiers.
 * Sans dependance externe ni cache serveur — adapte a un hebergement mutualise (Hostinger).
 *
 * Usage :
 *   RateLimiter::enforce('login', 5, 300); // 5 tentatives / 5 min / IP
 */
final class RateLimiter
{
    /**
     * Incremente le compteur pour (action + IP) et repond 429 si le quota est depasse.
     */
    public static function enforce(string $action, int $maxAttempts, int $windowSeconds): void
    {
        $dir = self::storageDir();
        if ($dir === null) {
            return; // stockage indisponible : on n'empeche pas le service.
        }

        $now = time();
        $bucket = $action . '|' . self::clientIp();
        $file = $dir . DIRECTORY_SEPARATOR . hash('sha256', $bucket) . '.json';

        $count = 0;
        $reset = $now + $windowSeconds;

        $handle = @fopen($file, 'c+');
        if ($handle === false) {
            return;
        }

        if (flock($handle, LOCK_EX)) {
            $raw = stream_get_contents($handle);
            $data = json_decode((string) $raw, true);
            if (is_array($data) && isset($data['reset'], $data['count']) && (int) $data['reset'] > $now) {
                $count = (int) $data['count'];
                $reset = (int) $data['reset'];
            }

            $count++;

            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode(['count' => $count, 'reset' => $reset]));
            fflush($handle);
            flock($handle, LOCK_UN);
        }
        fclose($handle);

        // Nettoyage opportuniste des fichiers expires (~2 % des appels).
        if (random_int(1, 50) === 1) {
            self::gc($dir, $now);
        }

        if ($count > $maxAttempts) {
            $retry = max(1, $reset - $now);
            header('Retry-After: ' . $retry);
            Response::error(
                "Trop de tentatives. Veuillez reessayer dans {$retry} seconde(s).",
                429
            );
        }
    }

    private static function clientIp(): string
    {
        // Derriere le proxy Hostinger, l'IP reelle est dans X-Forwarded-For.
        $forwarded = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
        if ($forwarded !== '') {
            $first = trim(explode(',', $forwarded)[0]);
            if ($first !== '') {
                return $first;
            }
        }
        return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    }

    private static function storageDir(): ?string
    {
        $dir = TCH_BASE_PATH . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'ratelimit';
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            return null;
        }
        return is_writable($dir) ? $dir : null;
    }

    private static function gc(string $dir, int $now): void
    {
        foreach (glob($dir . DIRECTORY_SEPARATOR . '*.json') ?: [] as $file) {
            $data = json_decode((string) @file_get_contents($file), true);
            if (!is_array($data) || (int) ($data['reset'] ?? 0) <= $now) {
                @unlink($file);
            }
        }
    }
}
