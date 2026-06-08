<?php

declare(strict_types=1);

/**
 * Script ponctuel : test connexion Hostinger + migrations 015-017.
 * Usage : php database/run-remote-migrate.php [DB_HOST]
 */

$hosts = $argv[1] ?? null
    ? [$argv[1]]
    : [
        'mysql.hostinger.com',
        'mysql.hostinger.fr',
        'srv1782.hstgr.io',
        'srv1411.hstgr.io',
        'auth-db1411.hstgr.io',
        'auth-db1782.hstgr.io',
        '77.37.83.35',
        '93.127.179.60',
    ];

$user = (string) (getenv('DB_USER') ?: ($argv[2] ?? ''));
$pass = (string) (getenv('DB_PASS') ?: ($argv[3] ?? ''));
$dbName = (string) (getenv('DB_NAME') ?: 'u878418868_tchdb');
$port = 3306;

$pdo = null;
$usedHost = null;

foreach ($hosts as $host) {
    try {
        $pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8],
        );
        $usedHost = $host;
        echo "[OK] Connexion MySQL via {$host}\n";
        break;
    } catch (Throwable $e) {
        echo "[FAIL] {$host} : {$e->getMessage()}\n";
    }
}

if (!$pdo) {
    fwrite(STDERR, "\nImpossible de se connecter a distance.\n");
    fwrite(STDERR, "Activez MySQL distant dans hPanel et passez l'hote : php database/run-remote-migrate.php VOTRE_HOTE\n");
    exit(1);
}

$pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    migration VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_migration (migration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$applied = $pdo->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);
$files = glob(__DIR__ . '/migrations/*.sql') ?: [];
sort($files);

$ran = 0;
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
        $stmt = $pdo->prepare('INSERT INTO migrations (migration) VALUES (:m)');
        $stmt->execute(['m' => $name]);
        echo "[MIGRATION OK] {$name}\n";
        $ran++;
    } catch (Throwable $e) {
        // Colonne deja existante (017) ou table deja la
        if (str_contains($e->getMessage(), 'Duplicate column') || str_contains($e->getMessage(), 'already exists')) {
            $stmt = $pdo->prepare('INSERT IGNORE INTO migrations (migration) VALUES (:m)');
            $stmt->execute(['m' => $name]);
            echo "[SKIP/OK] {$name} (deja present)\n";
            continue;
        }
        fwrite(STDERR, "[ECHEC] {$name} : {$e->getMessage()}\n");
        exit(1);
    }
}

echo $ran === 0
    ? "\nAucune migration en attente — base deja a jour.\n"
    : "\n{$ran} migration(s) appliquee(s) sur {$usedHost}.\n";

$tables = ['community_likes', 'community_reviews'];
foreach ($tables as $t) {
    $exists = $pdo->query("SHOW TABLES LIKE '{$t}'")->fetch();
    echo ($exists ? '[OK]' : '[MANQUANT]') . " table {$t}\n";
}

$col = $pdo->query("SHOW COLUMNS FROM community_events LIKE 'poster_url'")->fetch();
echo ($col ? '[OK]' : '[MANQUANT]') . " colonne community_events.poster_url\n";
