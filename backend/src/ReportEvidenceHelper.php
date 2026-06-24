<?php

declare(strict_types=1);

namespace TCH;

final class ReportEvidenceHelper
{
    private const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'application/pdf' => 'pdf',
    ];

    public static function basePath(): string
    {
        return TCH_BASE_PATH . '/storage/reports';
    }

    /** @return array{key: string, originalName: string, mime: string} */
    public static function store(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('Fichier invalide ou manquant.', 422);
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            Response::error('Fichier invalide ou manquant.', 422);
        }

        $maxBytes = (int) env('MAX_REPORT_UPLOAD_SIZE', 8_388_608);
        if (($file['size'] ?? 0) > $maxBytes) {
            Response::error('Fichier trop volumineux (max ' . round($maxBytes / 1_048_576, 1) . ' Mo).', 422);
        }

        $mime = self::detectMime($tmpName);
        if ($mime === null || !isset(self::ALLOWED[$mime])) {
            Response::error('Format non autorise. JPG, PNG, WebP, GIF ou PDF uniquement.', 422);
        }

        if ($mime !== 'application/pdf' && @getimagesize($tmpName) === false) {
            Response::error('Format non autorise. JPG, PNG, WebP, GIF ou PDF uniquement.', 422);
        }

        $subdir = date('Y/m');
        $dir = self::basePath() . '/' . $subdir;
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            Response::error('Impossible de creer le dossier de stockage.', 500);
        }

        $name = bin2hex(random_bytes(16)) . '.' . self::ALLOWED[$mime];
        $dest = $dir . '/' . $name;

        if (!move_uploaded_file($tmpName, $dest)) {
            Response::error('Echec de l\'enregistrement du fichier.', 500);
        }

        $original = basename((string) ($file['name'] ?? 'fichier'));
        $original = preg_replace('/[^\w.\-() ]+/u', '_', $original) ?: 'fichier';

        return [
            'key' => $subdir . '/' . $name,
            'originalName' => mb_substr($original, 0, 180),
            'mime' => $mime,
        ];
    }

    public static function resolvePath(string $key): ?string
    {
        $key = str_replace('\\', '/', trim($key));
        if ($key === '' || str_contains($key, '..') || str_starts_with($key, '/')) {
            return null;
        }

        $full = self::basePath() . '/' . $key;
        $realBase = realpath(self::basePath());
        $realFile = realpath($full);
        if ($realBase === false || $realFile === false) {
            return null;
        }

        $prefix = rtrim($realBase, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        if (!str_starts_with($realFile, $prefix)) {
            return null;
        }

        return is_file($realFile) ? $realFile : null;
    }

    public static function mimeForPath(string $path): ?string
    {
        if (!is_file($path)) {
            return null;
        }

        return self::detectMime($path);
    }

    /** @param list<array{key?: string}> $evidence */
    public static function validateKeys(array $evidence): array
    {
        $out = [];
        foreach (array_slice($evidence, 0, 5) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $key = trim((string) ($item['key'] ?? ''));
            $path = self::resolvePath($key);
            if ($path === null) {
                continue;
            }

            $mime = self::detectMime($path);
            if ($mime === null || !isset(self::ALLOWED[$mime])) {
                continue;
            }

            $original = trim((string) ($item['originalName'] ?? 'preuve'));
            $original = preg_replace('/[^\w.\-() ]+/u', '_', basename($original)) ?: 'preuve';

            $out[] = [
                'key' => $key,
                'originalName' => mb_substr($original, 0, 180),
                'mime' => $mime,
            ];
        }
        return $out;
    }

    /** @param list<array{key?: string}> $evidence */
    public static function deleteEvidenceList(array $evidence): void
    {
        foreach ($evidence as $item) {
            if (!is_array($item)) {
                continue;
            }
            $path = self::resolvePath((string) ($item['key'] ?? ''));
            if ($path && is_file($path)) {
                @unlink($path);
            }
        }
    }

    private static function detectMime(string $path): ?string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path) ?: '';

        return $mime !== '' ? $mime : null;
    }
}
