<?php

declare(strict_types=1);

/**
 * Runner de migrations via HTTP (Hostinger sans SSH).
 * Protege par MIGRATE_TOKEN dans .env — supprimez ce fichier apres usage.
 *
 *   GET /run-migrations.php?token=VOTRE_TOKEN
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use TCH\CommunityHelper;
use TCH\Database;
use TCH\Response;

header('Content-Type: application/json; charset=utf-8');

$token = (string) ($_GET['token'] ?? '');
$expected = (string) env('MIGRATE_TOKEN', env('JWT_SECRET', ''));

if ($expected === '' || !hash_equals($expected, $token)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Token invalide.']);
    exit;
}

try {
    $pdo = Database::connection();
    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        migration VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_migration (migration)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $applied = $pdo->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);
    $dir = dirname(__DIR__) . '/database/migrations';
    $files = glob($dir . '/*.sql') ?: [];
    sort($files);

    $ran = [];
    foreach ($files as $file) {
        $name = basename($file);
        if (in_array($name, $applied, true)) {
            continue;
        }

        $sql = file_get_contents($file);
        if ($sql === false || trim($sql) === '') {
            continue;
        }

        try {
            $pdo->exec($sql);
        } catch (Throwable $e) {
            if (
                str_contains($e->getMessage(), 'Duplicate column')
                || str_contains($e->getMessage(), 'already exists')
            ) {
                /* deja applique manuellement */
            } else {
                throw $e;
            }
        }

        $stmt = $pdo->prepare('INSERT IGNORE INTO migrations (migration) VALUES (:m)');
        $stmt->execute(['m' => $name]);
        $ran[] = $name;
    }

    try {
        $hasSlug = $pdo->query("SHOW COLUMNS FROM communities LIKE 'slug'")->fetch();
        if ($hasSlug) {
            CommunityHelper::backfillSlugs($pdo);
        }
    } catch (Throwable) {
        /* ignore */
    }

    $checks = [
        'community_likes' => (bool) $pdo->query("SHOW TABLES LIKE 'community_likes'")->fetch(),
        'community_reviews' => (bool) $pdo->query("SHOW TABLES LIKE 'community_reviews'")->fetch(),
        'poster_url' => (bool) $pdo->query("SHOW COLUMNS FROM community_events LIKE 'poster_url'")->fetch(),
    ];

    echo json_encode([
        'success' => true,
        'message' => count($ran) === 0 ? 'Deja a jour.' : count($ran) . ' migration(s) appliquee(s).',
        'applied' => $ran,
        'checks' => $checks,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
