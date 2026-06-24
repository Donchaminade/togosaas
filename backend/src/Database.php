<?php

declare(strict_types=1);

namespace TCH;

use PDO;
use PDOException;

/**
 * Connexion MySQL via PDO (singleton).
 */
final class Database
{
    private static ?PDO $instance = null;

    public static function connection(): PDO
    {
        if (self::$instance instanceof PDO) {
            return self::$instance;
        }

        $host = (string) env('DB_HOST', '127.0.0.1');
        $port = (string) env('DB_PORT', '3306');
        $name = (string) env('DB_NAME', 'tch_db');
        $charset = (string) env('DB_CHARSET', 'utf8mb4');
        $user = (string) env('DB_USER', 'root');
        $pass = (string) env('DB_PASS', '');

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

        try {
            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            Response::error(
                TCH_DEBUG ? $e->getMessage() : 'Connexion a la base de donnees impossible.',
                500
            );
        }

        return self::$instance;
    }

    /**
     * Connexion "serveur" sans selectionner de base (utile pour creer la base).
     */
    public static function serverConnection(): PDO
    {
        $host = (string) env('DB_HOST', '127.0.0.1');
        $port = (string) env('DB_PORT', '3306');
        $charset = (string) env('DB_CHARSET', 'utf8mb4');
        $user = (string) env('DB_USER', 'root');
        $pass = (string) env('DB_PASS', '');

        $dsn = "mysql:host={$host};port={$port};charset={$charset}";

        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
}
