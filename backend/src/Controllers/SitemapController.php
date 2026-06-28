<?php

declare(strict_types=1);

namespace TCH\Controllers;

use TCH\Database;
use TCH\Request;
use TCH\Security;

/**
 * Sitemap XML dynamique : liste les routes publiques principales + chaque
 * solution approuvee (par slug). Sert le SEO/acquisition (Google, Bing).
 *
 * Sortie XML brute (pas l'enveloppe JSON habituelle).
 */
final class SitemapController
{
    public function index(Request $request): void
    {
        $base = self::frontendBaseUrl();

        $urls = [];
        $today = date('Y-m-d');

        // Routes statiques principales.
        foreach (['/', '/solutions', '/a-propos', '/contact', '/mentions-legales'] as $path) {
            $urls[] = [
                'loc' => $base . $path,
                'lastmod' => $today,
                'priority' => $path === '/' ? '1.0' : '0.7',
                'changefreq' => $path === '/solutions' ? 'daily' : 'weekly',
            ];
        }

        // Solutions approuvees.
        try {
            $rows = Database::connection()->query(
                "SELECT slug, id, updated_at, created_at FROM communities WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 5000"
            )->fetchAll();
            foreach ($rows as $row) {
                $ref = $row['slug'] !== null && $row['slug'] !== '' ? $row['slug'] : (string) $row['id'];
                $lastmod = $row['updated_at'] ?? $row['created_at'] ?? null;
                $urls[] = [
                    'loc' => $base . '/solutions/' . rawurlencode((string) $ref),
                    'lastmod' => $lastmod !== null ? date('Y-m-d', strtotime((string) $lastmod)) : $today,
                    'priority' => '0.8',
                    'changefreq' => 'weekly',
                ];
            }
        } catch (\Throwable) {
            // En cas d'erreur DB, on sert au moins les routes statiques.
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $u) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>' . htmlspecialchars($u['loc'], ENT_XML1, 'UTF-8') . "</loc>\n";
            $xml .= '    <lastmod>' . $u['lastmod'] . "</lastmod>\n";
            $xml .= '    <changefreq>' . $u['changefreq'] . "</changefreq>\n";
            $xml .= '    <priority>' . $u['priority'] . "</priority>\n";
            $xml .= "  </url>\n";
        }
        $xml .= '</urlset>';

        http_response_code(200);
        Security::applyHeaders();
        header('Content-Type: application/xml; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        echo $xml;
        exit;
    }

    private static function frontendBaseUrl(): string
    {
        $origins = Security::allowedOrigins();
        $base = $origins[0] ?? (string) env('FRONTEND_URL', '');
        $base = rtrim((string) $base, '/');
        return $base !== '' ? $base : 'https://togosaas.vercel.app';
    }
}
