<?php

declare(strict_types=1);

/**
 * Routeur pour le serveur web integre de PHP :
 *   php -S localhost:8000 -t backend/public backend/public/router.php
 *
 * Sert les fichiers statiques existants, sinon delegue tout a index.php.
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// Fichiers uploades (stockage interne)
if (str_starts_with($uri, '/uploads/')) {
    $relative = ltrim(substr($uri, strlen('/uploads/')), '/');
    if ($relative !== '' && !str_contains($relative, '..')) {
        $file = dirname(__DIR__) . '/storage/uploads/' . $relative;
        if (is_file($file)) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($file) ?: 'application/octet-stream';
            header('Content-Type: ' . $mime);
            header('Cache-Control: public, max-age=31536000, immutable');
            readfile($file);
            exit;
        }
    }
    http_response_code(404);
    exit;
}

$file = __DIR__ . $uri;

if ($uri !== '/' && is_file($file)) {
    return false; // Laisse le serveur integre servir le fichier statique.
}

require __DIR__ . '/index.php';
