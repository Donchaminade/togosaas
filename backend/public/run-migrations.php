<?php

declare(strict_types=1);

/**
 * Runner de migrations via HTTP (Hostinger sans SSH).
 *
 * SECURITE :
 *   - Necessite un MIGRATE_TOKEN DEDIE et long dans .env (aucun repli sur JWT_SECRET).
 *   - Le token n'est PAS accepte en query string (logs d'acces, Referer, historique).
 *   - A SUPPRIMER du serveur immediatement apres la migration, puis regenerer MIGRATE_TOKEN.
 *
 *   curl -X POST -H "X-Migrate-Token: VOTRE_MIGRATE_TOKEN" https://hote/run-migrations.php
 *   curl -X POST -d "token=VOTRE_MIGRATE_TOKEN" https://hote/run-migrations.php
 *   curl -X POST -H "Content-Type: application/json" -d '{"token":"VOTRE_MIGRATE_TOKEN"}' https://hote/run-migrations.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use TCH\CommunityHelper;
use TCH\Database;
use TCH\Response;

header('Content-Type: application/json; charset=utf-8');

// Refuse meme si un en-tete valide est aussi present : l'URL ne doit plus porter le secret.
if (isset($_GET['token']) && (string) $_GET['token'] !== '') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Le token en query string n\'est plus accepte. Utilisez l\'en-tete X-Migrate-Token ou un corps POST.',
    ]);
    exit;
}

$token = migrationToken();
$expected = (string) env('MIGRATE_TOKEN', '');

// Token dedie obligatoire : on refuse tout repli implicite et les tokens trop courts.
if ($expected === '' || strlen($expected) < 16) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'MIGRATE_TOKEN absent ou trop court dans .env (min. 16 caracteres).',
    ]);
    exit;
}

if ($token === '' || !hash_equals($expected, $token)) {
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

/**
 * Token via en-tete ou corps POST uniquement. La query string est ignoree.
 */
function migrationToken(): string
{
    $header = $_SERVER['HTTP_X_MIGRATE_TOKEN'] ?? '';
    if (is_string($header) && $header !== '') {
        return $header;
    }

    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        return '';
    }

    $posted = $_POST['token'] ?? null;
    if (is_string($posted) && $posted !== '') {
        return $posted;
    }

    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') {
        return '';
    }
    $json = json_decode($raw, true);
    if (is_array($json) && isset($json['token']) && is_string($json['token']) && $json['token'] !== '') {
        return $json['token'];
    }

    return '';
}
