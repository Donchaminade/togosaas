<?php

declare(strict_types=1);

namespace TCH;

/**
 * Gestion des pieces jointes des campagnes email : stockage prive sous
 * storage/email, validation par extension + MIME, et resolution securisee
 * des chemins pour l'envoi.
 */
final class EmailAttachmentHelper
{
    /** Extensions autorisees => type MIME associe. */
    private const ALLOWED = [
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'webp' => 'image/webp',
        'gif'  => 'image/gif',
        'pdf'  => 'application/pdf',
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls'  => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt'  => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt'  => 'text/plain',
        'csv'  => 'text/csv',
        'zip'  => 'application/zip',
    ];

    public const MAX_FILES = 5;

    public static function basePath(): string
    {
        return TCH_BASE_PATH . '/storage/email';
    }

    private static function maxBytes(): int
    {
        return (int) env('MAX_EMAIL_UPLOAD_SIZE', 10_485_760); // 10 Mo par defaut
    }

    /** @return array{key: string, originalName: string, mime: string, size: int} */
    public static function store(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('Fichier invalide ou manquant.', 422);
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            Response::error('Fichier invalide ou manquant.', 422);
        }

        if (($file['size'] ?? 0) > self::maxBytes()) {
            Response::error('Fichier trop volumineux (max ' . round(self::maxBytes() / 1_048_576, 1) . ' Mo).', 422);
        }

        $original = basename((string) ($file['name'] ?? 'fichier'));
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        if (!isset(self::ALLOWED[$ext])) {
            Response::error('Format non autorise. Images, PDF, Word, Excel, PowerPoint, TXT, CSV ou ZIP uniquement.', 422);
        }

        $mime = self::ALLOWED[$ext];

        // Pour les images, on verifie que le contenu correspond bien a une image.
        if (str_starts_with($mime, 'image/') && @getimagesize($tmpName) === false) {
            Response::error('Image invalide ou corrompue.', 422);
        }

        $subdir = date('Y/m');
        $dir = self::basePath() . '/' . $subdir;
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            Response::error('Impossible de creer le dossier de stockage.', 500);
        }

        $name = bin2hex(random_bytes(16)) . '.' . $ext;
        $dest = $dir . '/' . $name;

        if (!move_uploaded_file($tmpName, $dest)) {
            Response::error('Echec de l\'enregistrement du fichier.', 500);
        }

        $cleanOriginal = preg_replace('/[^\w.\-() ]+/u', '_', $original) ?: 'fichier';

        return [
            'key' => $subdir . '/' . $name,
            'originalName' => mb_substr($cleanOriginal, 0, 180),
            'mime' => $mime,
            'size' => (int) filesize($dest),
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

    /**
     * Valide une liste de cles fournies par le client et renvoie les metadonnees.
     *
     * @param mixed $input
     * @return list<array{key: string, originalName: string, mime: string, size: int}>
     */
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
            $path = self::resolvePath($key);
            if ($path === null) {
                continue;
            }

            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if (!isset(self::ALLOWED[$ext])) {
                continue;
            }

            $original = trim((string) ($item['originalName'] ?? 'fichier'));
            $original = preg_replace('/[^\w.\-() ]+/u', '_', basename($original)) ?: 'fichier';

            $out[] = [
                'key' => $key,
                'originalName' => mb_substr($original, 0, 180),
                'mime' => self::ALLOWED[$ext],
                'size' => (int) filesize($path),
            ];
        }

        return $out;
    }

    /**
     * Prepare la liste des pieces jointes pour le Mailer (chemins absolus).
     *
     * @param list<array{key?: string, originalName?: string, mime?: string}> $attachments
     * @return list<array{path: string, name: string, mime: string}>
     */
    public static function toMailerAttachments(array $attachments): array
    {
        $out = [];
        foreach ($attachments as $item) {
            $path = self::resolvePath((string) ($item['key'] ?? ''));
            if ($path === null) {
                continue;
            }
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $out[] = [
                'path' => $path,
                'name' => (string) ($item['originalName'] ?? basename($path)),
                'mime' => self::ALLOWED[$ext] ?? 'application/octet-stream',
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
