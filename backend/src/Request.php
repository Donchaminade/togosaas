<?php

declare(strict_types=1);

namespace TCH;

/**
 * Encapsule la requete HTTP entrante (corps JSON, query, params de route).
 */
final class Request
{
    private array $body;
    private array $query;
    public array $params = [];

    public function __construct()
    {
        $this->query = $_GET ?? [];

        $raw = file_get_contents('php://input') ?: '';
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $this->body = $decoded;
        } else {
            // Fallback formulaire classique.
            $this->body = $_POST ?? [];
        }
    }

    public function input(string $key, $default = null)
    {
        return $this->body[$key] ?? $default;
    }

    public function query(string $key, $default = null)
    {
        return $this->query[$key] ?? $default;
    }

    public function param(string $key, $default = null)
    {
        return $this->params[$key] ?? $default;
    }

    public function all(): array
    {
        return $this->body;
    }

    public function only(array $keys): array
    {
        $out = [];
        foreach ($keys as $key) {
            if (array_key_exists($key, $this->body)) {
                $out[$key] = $this->body[$key];
            }
        }
        return $out;
    }
}
