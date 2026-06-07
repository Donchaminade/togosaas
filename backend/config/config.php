<?php

declare(strict_types=1);

/**
 * Chargement de la configuration depuis le fichier .env (parseur minimaliste,
 * sans dependance externe) puis exposition via une fonction helper env().
 */

if (!function_exists('tch_load_env')) {
    function tch_load_env(string $path): void
    {
        if (!is_file($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));

            // Retire d'eventuels guillemets entourants.
            if (strlen($value) >= 2) {
                $first = $value[0];
                $last = $value[strlen($value) - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            if ($key !== '') {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

if (!function_exists('env')) {
    function env(string $key, $default = null)
    {
        $value = $_ENV[$key] ?? getenv($key);
        if ($value === false || $value === null || $value === '') {
            return $default;
        }

        // Conversion des booleens textuels.
        return match (strtolower((string) $value)) {
            'true' => true,
            'false' => false,
            'null' => null,
            default => $value,
        };
    }
}

// Charge le .env situe a la racine du backend.
tch_load_env(dirname(__DIR__) . '/.env');

// Constantes globales pratiques.
define('TCH_BASE_PATH', dirname(__DIR__));
define('TCH_UPLOAD_PATH', TCH_BASE_PATH . '/storage/uploads');
define('TCH_DEBUG', (bool) env('APP_DEBUG', false));
