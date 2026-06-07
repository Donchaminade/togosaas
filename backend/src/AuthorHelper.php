<?php

declare(strict_types=1);

namespace TCH;

final class AuthorHelper
{
    public static function get(): ?array
    {
        $stmt = Database::connection()->query('SELECT * FROM site_author WHERE id = 1 LIMIT 1');
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function serialize(?array $row): array
    {
        if (!$row) {
            return self::defaults();
        }

        return [
            'name' => $row['name'],
            'roleLabel' => $row['role_label'],
            'badgeLabel' => $row['badge_label'],
            'quote' => $row['quote'],
            'bio' => $row['bio'],
            'photoUrl' => $row['photo_url'] ?? null,
            'linkedinUrl' => $row['linkedin_url'] ?? null,
            'githubUrl' => $row['github_url'] ?? null,
            'twitterUrl' => $row['twitter_url'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    public static function columnsFromRequest(Request $request): array
    {
        return [
            'name' => trim((string) $request->input('name')),
            'role_label' => trim((string) $request->input('roleLabel')),
            'badge_label' => trim((string) $request->input('badgeLabel')),
            'quote' => trim((string) $request->input('quote')),
            'bio' => trim((string) $request->input('bio')),
            'photo_url' => self::nullableString($request->input('photoUrl')),
            'linkedin_url' => self::nullableString($request->input('linkedinUrl')),
            'github_url' => self::nullableString($request->input('githubUrl')),
            'twitter_url' => self::nullableString($request->input('twitterUrl')),
        ];
    }

    public static function defaults(): array
    {
        return [
            'name' => 'Chaminade Dondah Adjolou',
            'roleLabel' => 'Initiateur du projet T.C.H',
            'badgeLabel' => 'Fondateur & Auteur',
            'quote' => 'T.C.H est une idée que je porte avec conviction : offrir aux communautés togolaises l\'espace qu\'elles méritent pour exister, se faire connaître et grandir. Chaque communauté est une graine ; ce hub est le terreau qui les aide à s\'épanouir et à se rencontrer.',
            'bio' => 'Passionné par l\'impact communautaire, Chaminade conçoit T.C.H comme un bien commun au service de toutes les communautés togolaises.',
            'photoUrl' => null,
            'linkedinUrl' => null,
            'githubUrl' => null,
            'twitterUrl' => null,
            'updatedAt' => null,
        ];
    }

    private static function nullableString($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return trim((string) $value);
    }
}
