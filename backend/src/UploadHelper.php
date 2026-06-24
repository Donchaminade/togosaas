<?php

declare(strict_types=1);

namespace TCH;

final class UploadHelper
{
    private const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    public static function store(array $file): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('Fichier invalide ou manquant.', 422);
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            Response::error('Fichier invalide ou manquant.', 422);
        }

        $maxBytes = (int) env('MAX_UPLOAD_SIZE', 5_242_880);
        if (($file['size'] ?? 0) > $maxBytes) {
            Response::error('Fichier trop volumineux (max ' . round($maxBytes / 1_048_576, 1) . ' Mo).', 422);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmpName) ?: '';
        if (!isset(self::ALLOWED[$mime])) {
            Response::error('Format non autorise. Utilisez JPG, PNG, WebP ou GIF.', 422);
        }

        if (@getimagesize($tmpName) === false) {
            Response::error('Format non autorise. Utilisez JPG, PNG, WebP ou GIF.', 422);
        }

        $subdir = date('Y/m');
        $dir = TCH_UPLOAD_PATH . '/' . $subdir;
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            Response::error('Impossible de creer le dossier de stockage.', 500);
        }

        $name = bin2hex(random_bytes(16)) . '.' . self::ALLOWED[$mime];
        $dest = $dir . '/' . $name;

        if (!move_uploaded_file($tmpName, $dest)) {
            Response::error('Echec de l\'enregistrement du fichier.', 500);
        }

        return '/uploads/' . $subdir . '/' . $name;
    }

    public static function publicPath(string $relativePath): string
    {
        return $relativePath;
    }
}
