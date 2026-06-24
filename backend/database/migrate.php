<?php

declare(strict_types=1);

/**
 * Runner de migrations en ligne de commande.
 *
 *   php database/migrate.php          -> applique les migrations en attente
 *   php database/migrate.php --fresh  -> supprime toutes les tables puis re-applique tout
 *
 * Cree la base de donnees si elle n'existe pas encore.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use TCH\CommunityHelper;
use TCH\Database;

$fresh = in_array('--fresh', $argv, true);

$dbName = (string) env('DB_NAME', 'tch_db');
$charset = (string) env('DB_CHARSET', 'utf8mb4');

echo "==> TogoSaaS : migrations\n";

/* 1. Creer la base si besoin. */
try {
    $server = Database::serverConnection();
    $server->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET {$charset} COLLATE {$charset}_unicode_ci");
    echo "    Base '{$dbName}' prete.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "[ERREUR] Impossible de creer la base : " . $e->getMessage() . "\n");
    exit(1);
}

$pdo = Database::connection();

/* 2. Mode --fresh : on droppe tout. */
if ($fresh) {
    echo "    Mode --fresh : suppression des tables existantes...\n";
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `{$table}`");
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
}

/* 3. Table de suivi des migrations. */
$pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    migration VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_migration (migration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$applied = $pdo->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);

/* 4. Application des fichiers .sql dans l'ordre. */
$files = glob(__DIR__ . '/migrations/*.sql') ?: [];
sort($files);

$ran = 0;
foreach ($files as $file) {
    $name = basename($file);
    /* Bundles Hostinger = doublons des migrations numérotées, à ignorer en local. */
    if (str_starts_with($name, 'hostinger_')) {
        continue;
    }
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
        echo "    [OK] {$name}\n";
        $ran++;
    } catch (Throwable $e) {
        fwrite(STDERR, "    [ECHEC] {$name} : " . $e->getMessage() . "\n");
        exit(1);
    }
}

echo $ran === 0
    ? "    Aucune migration en attente. Tout est a jour.\n"
    : "==> {$ran} migration(s) appliquee(s).\n";

try {
    $hasSlug = $pdo->query("SHOW COLUMNS FROM communities LIKE 'slug'")->fetch();
    if ($hasSlug) {
        $filled = CommunityHelper::backfillSlugs($pdo);
        if ($filled > 0) {
            echo "    Slugs communautes : {$filled} fiche(s) mise(s) a jour.\n";
        }
    }
} catch (Throwable $e) {
    fwrite(STDERR, "    [AVERTISSEMENT] Backfill slugs : " . $e->getMessage() . "\n");
}

echo "Termine. Lancez 'php database/seed.php' pour inserer les donnees initiales.\n";
