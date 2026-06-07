<?php

declare(strict_types=1);

/**
 * Exporte la base locale vers un fichier SQL HORS du dossier backend
 * (jamais deploye sur Hostinger).
 *
 *   php database/export-for-hostinger.php
 *
 * Produit : ../.private/db-exports/tch_export_YYYYMMDD_HHMMSS.sql
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

$host = (string) env('DB_HOST', '127.0.0.1');
$port = (string) env('DB_PORT', '3306');
$user = (string) env('DB_USER', 'root');
$pass = (string) env('DB_PASS', '');
$name = (string) env('DB_NAME', 'tch_db');

$outDir = dirname(__DIR__, 2) . '/.private/db-exports';
if (!is_dir($outDir) && !mkdir($outDir, 0755, true)) {
    fwrite(STDERR, "[ERREUR] Impossible de creer {$outDir}\n");
    exit(1);
}

$filename = 'tch_export_' . date('Ymd_His') . '.sql';
$output = $outDir . '/' . $filename;

$mysqldump = getenv('MYSQLDUMP_PATH') ?: 'mysqldump';
if (PHP_OS_FAMILY === 'Windows' && !is_executable($mysqldump)) {
    $candidates = [
        'C:\\xampp\\mysql\\bin\\mysqldump.exe',
        'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
    ];
    foreach ($candidates as $candidate) {
        if (is_file($candidate)) {
            $mysqldump = $candidate;
            break;
        }
    }
}

$cmd = sprintf(
    '%s -h %s -P %s -u %s %s --single-transaction --routines --triggers --set-charset --default-character-set=utf8mb4 --result-file=%s %s',
    escapeshellarg($mysqldump),
    escapeshellarg($host),
    escapeshellarg($port),
    escapeshellarg($user),
    $pass !== '' ? '-p' . escapeshellarg($pass) : '',
    escapeshellarg($output),
    escapeshellarg($name),
);

echo "==> Export BDD (hors backend, ne pas uploader sur Hostinger)\n";
echo "    Base source : {$name}@{$host}\n";
echo "    Fichier     : {$output}\n";

exec($cmd, $lines, $code);

if ($code !== 0 || !is_file($output)) {
    fwrite(STDERR, "[ERREUR] mysqldump a echoue (code {$code}).\n");
    fwrite(STDERR, "Installez mysqldump ou definissez MYSQLDUMP_PATH dans l'environnement.\n");
    exit(1);
}

$size = filesize($output) ?: 0;
echo '    Taille      : ' . number_format($size / 1024, 1) . " Ko\n";
echo "==> Importez ce fichier dans phpMyAdmin, puis supprimez-le de votre PC si besoin.\n";
