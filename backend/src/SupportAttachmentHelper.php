<?php

declare(strict_types=1);

namespace TCH;

final class SupportAttachmentHelper
{
    private const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'application/pdf' => 'pdf',
    ];

    public const MAX_FILES = 3;

    public static function basePath(): string
    {
        return TCH_BASE_PATH . '/storage/support';
    }

    /** @return array{key: string, originalName: string, mime: string, size: int} */
    public static function store(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('Fichier invalide ou manquant.', 422);
        }

        $maxBytes = (int) env('MAX_SUPPORT_UPLOAD_SIZE', 5_242_880);
        if (($file['size'] ?? 0) > $maxBytes) {
            Response::error('Fichier trop volumineux (max ' . round($maxBytes / 1_048_576, 1) . ' Mo).', 422);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name'] ?? '') ?: '';
        if (!isset(self::ALLOWED[$mime])) {
            Response::error('Format non autorise. JPG, PNG, WebP, GIF ou PDF uniquement.', 422);
        }

        $subdir = date('Y/m');
        $dir = self::basePath() . '/' . $subdir;
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            Response::error('Impossible de creer le dossier de stockage.', 500);
        }

        $name = bin2hex(random_bytes(16)) . '.' . self::ALLOWED[$mime];
        $dest = $dir . '/' . $name;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Echec de l\'enregistrement du fichier.', 500);
        }

        $original = basename((string) ($file['name'] ?? 'fichier'));
        $original = preg_replace('/[^\w.\-() ]+/u', '_', $original) ?: 'fichier';

        return [
            'key' => $subdir . '/' . $name,
            'originalName' => mb_substr($original, 0, 180),
            'mime' => $mime,
            'size' => (int) ($file['size'] ?? 0),
        ];
    }

    public static function resolvePath(string $key): ?string
    {
        $key = str_replace('\\', '/', trim($key));
        if ($key === '' || str_contains($key, '..')) {
            return null;
        }

        $full = self::basePath() . '/' . $key;
        return is_file($full) ? $full : null;
    }

    /** @param mixed $input */
    public static function validateKeys($input): array
    {
        if (!is_array($input)) {
            return [];
        }

        $out = [];
        foreach (array_slice($input, 0, self::MAX_FILES) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $key = trim((string) ($item['key'] ?? ''));
            if ($key === '' || !self::resolvePath($key)) {
                continue;
            }
            $out[] = [
                'key' => $key,
                'originalName' => mb_substr(trim((string) ($item['originalName'] ?? 'fichier')), 0, 180),
                'mime' => (string) ($item['mime'] ?? 'application/octet-stream'),
                'size' => (int) ($item['size'] ?? 0),
            ];
        }

        return $out;
    }

    /** @param mixed $raw */
    public static function decodeList($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            return is_array($decoded) ? $decoded : [];
        }
        return is_array($raw) ? $raw : [];
    }

    /** @param list<array{key?: string}> $attachments */
    public static function deleteList(array $attachments): void
    {
        foreach ($attachments as $item) {
            $path = self::resolvePath((string) ($item['key'] ?? ''));
            if ($path !== null && is_file($path)) {
                @unlink($path);
            }
        }
    }
}
