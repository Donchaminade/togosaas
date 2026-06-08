<?php

declare(strict_types=1);

/**
 * Migration ponctuelle Hostinger — uploadez dans public/ puis appelez une fois :
 *   https://tch.grosbit.com/migrate-once.php?token=VOTRE_JWT_SECRET
 * Supprimez ce fichier apres execution reussie.
 */

header('Content-Type: application/json; charset=utf-8');

$token = (string) ($_GET['token'] ?? '');
$envPath = dirname(__DIR__) . '/.env';

if (!is_file($envPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '.env introuvable sur le serveur.']);
    exit;
}

$env = [];
foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
        continue;
    }
    [$k, $v] = explode('=', $line, 2);
    $env[trim($k)] = trim($v, " \t\"'");
}

$expected = $env['MIGRATE_TOKEN'] ?? $env['JWT_SECRET'] ?? '';
if ($expected === '' || !hash_equals($expected, $token)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Token invalide.']);
    exit;
}

$host = $env['DB_HOST'] ?? 'localhost';
$port = $env['DB_PORT'] ?? '3306';
$name = $env['DB_NAME'] ?? '';
$user = $env['DB_USER'] ?? '';
$pass = $env['DB_PASS'] ?? '';

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
    );

    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        migration VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_migration (migration)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $applied = $pdo->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);

    $statements = [
        '015_create_community_likes_table.sql' => <<<'SQL'
CREATE TABLE IF NOT EXISTS community_likes (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    community_id BIGINT UNSIGNED NOT NULL,
    visitor_id   VARCHAR(64) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_community_like_visitor (community_id, visitor_id),
    KEY idx_community_likes_community (community_id),
    CONSTRAINT fk_community_likes_community FOREIGN KEY (community_id)
        REFERENCES communities (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL,
        '016_create_community_reviews_table.sql' => <<<'SQL'
CREATE TABLE IF NOT EXISTS community_reviews (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    community_id BIGINT UNSIGNED NOT NULL,
    visitor_id   VARCHAR(64) NOT NULL,
    rating       TINYINT UNSIGNED NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_community_review_visitor (community_id, visitor_id),
    KEY idx_community_reviews_community (community_id),
    CONSTRAINT fk_community_reviews_community FOREIGN KEY (community_id)
        REFERENCES communities (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_community_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL,
        '017_add_event_poster_url.sql' => <<<'SQL'
ALTER TABLE community_events
    ADD COLUMN poster_url VARCHAR(500) NULL AFTER description
SQL,
    ];

    $ran = [];
    foreach ($statements as $name => $sql) {
        if (in_array($name, $applied, true)) {
            continue;
        }
        try {
            $pdo->exec($sql);
        } catch (PDOException $e) {
            if (!str_contains($e->getMessage(), 'Duplicate column')) {
                throw $e;
            }
        }
        $pdo->prepare('INSERT IGNORE INTO migrations (migration) VALUES (:m)')->execute(['m' => $name]);
        $ran[] = $name;
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
