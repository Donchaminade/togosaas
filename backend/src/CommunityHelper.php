<?php

declare(strict_types=1);

namespace TCH;

use TCH\Request;

/**
 * Mapping partage entre BDD et API pour les communautes.
 */
final class CommunityHelper
{
    public const SOCIAL_FIELDS = [
        'whatsappUrl' => 'whatsapp_url',
        'telegramUrl' => 'telegram_url',
        'linkedinUrl' => 'linkedin_url',
        'twitterUrl' => 'twitter_url',
        'websiteUrl' => 'website_url',
        'logoUrl' => 'logo_url',
        'bannerUrl' => 'banner_url',
    ];

    public static function columnsFromRequest(Request $request): array
    {
        $tags = $request->input('tags', []);
        if (!is_array($tags)) {
            $tags = [];
        }
        $tags = array_values(array_slice(array_map('strval', $tags), 0, 6));

        $coLeads = $request->input('coLeads', []);
        if (!is_array($coLeads)) {
            $coLeads = [];
        }
        $coLeads = array_values(array_slice(array_map(static function ($item) {
            if (!is_array($item)) {
                return null;
            }
            $name = trim((string) ($item['name'] ?? ''));
            if ($name === '') {
                return null;
            }
            return [
                'name' => $name,
                'role' => self::nullableString($item['role'] ?? null),
                'email' => self::nullableString($item['email'] ?? null),
                'photoUrl' => self::nullableString($item['photoUrl'] ?? null),
                'bio' => self::nullableString($item['bio'] ?? null),
                'linkedinUrl' => self::nullableString($item['linkedinUrl'] ?? null),
            ];
        }, $coLeads), 0, 8));
        $coLeads = array_values(array_filter($coLeads));

        $gallery = $request->input('gallery', []);
        if (!is_array($gallery)) {
            $gallery = [];
        }
        $gallery = array_values(array_slice(array_filter(array_map(
            static fn($u) => is_string($u) && trim($u) !== '' ? trim($u) : null,
            $gallery
        )), 0, 12));

        $cols = [
            'name' => trim((string) $request->input('name')),
            'description' => trim((string) $request->input('description')),
            'short_description' => self::nullableString($request->input('shortDescription')),
            'mission' => self::nullableString($request->input('mission')),
            'country' => trim((string) $request->input('country')),
            'city' => self::nullableString($request->input('city')),
            'tags' => json_encode($tags, JSON_UNESCAPED_UNICODE),
            'leader_name' => trim((string) $request->input('leaderName')),
            'leader_email' => strtolower(trim((string) $request->input('leaderEmail'))),
            'leader_phone' => self::nullableString($request->input('leaderPhone')),
            'leader_photo_url' => self::nullableString($request->input('leaderPhotoUrl')),
            'leader_bio' => self::nullableString($request->input('leaderBio')),
            'co_leads' => json_encode($coLeads, JSON_UNESCAPED_UNICODE),
            'gallery' => json_encode($gallery, JSON_UNESCAPED_UNICODE),
            'founded_year' => $request->input('foundedYear') !== null && $request->input('foundedYear') !== ''
                ? (int) $request->input('foundedYear') : null,
            'member_count' => $request->input('memberCount') !== null && $request->input('memberCount') !== ''
                ? (int) $request->input('memberCount') : null,
            'meeting_info' => self::nullableString($request->input('meetingInfo')),
            'public_email' => self::nullableString($request->input('publicEmail')),
            'lat' => $request->input('lat') !== null && $request->input('lat') !== '' ? (float) $request->input('lat') : null,
            'lng' => $request->input('lng') !== null && $request->input('lng') !== '' ? (float) $request->input('lng') : null,
        ];

        foreach (self::SOCIAL_FIELDS as $jsonKey => $dbCol) {
            $cols[$dbCol] = self::nullableString($request->input($jsonKey));
        }

        $pricingType = trim((string) $request->input('pricingType', 'free'));
        if (!in_array($pricingType, ['free', 'freemium', 'paid'], true)) {
            $pricingType = 'free';
        }
        $cols['pricing_type'] = $pricingType;

        $priceAmount = $request->input('priceAmount');
        $cols['price_amount'] = ($priceAmount !== null && $priceAmount !== '')
            ? round((float) $priceAmount, 2) : null;

        $currency = trim((string) $request->input('currency', 'XOF'));
        $cols['currency'] = $currency !== '' ? strtoupper(substr($currency, 0, 8)) : 'XOF';

        $billingPeriod = self::nullableString($request->input('billingPeriod'));
        if ($billingPeriod !== null && !in_array($billingPeriod, ['monthly', 'yearly', 'one_time'], true)) {
            $billingPeriod = null;
        }
        $cols['billing_period'] = $billingPeriod;

        $cols['app_url'] = self::nullableString($request->input('appUrl'));
        $cols['demo_url'] = self::nullableString($request->input('demoUrl'));

        return $cols;
    }

    /** Ajoute ou met à jour le slug à partir du nom. */
    public static function withSlug(array $cols, \PDO $db, ?int $excludeId = null): array
    {
        $name = trim((string) ($cols['name'] ?? ''));
        if ($name !== '') {
            $cols['slug'] = self::uniqueSlug($db, $name, $excludeId);
        }
        return $cols;
    }

    public static function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        if (function_exists('transliterator_transliterate')) {
            $converted = transliterator_transliterate('Any-Latin; Latin-ASCII', $text);
            if (is_string($converted) && $converted !== '') {
                $text = strtolower($converted);
            }
        } else {
            $iconv = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
            if (is_string($iconv) && $iconv !== '') {
                $text = strtolower($iconv);
            }
        }

        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
        $text = trim($text, '-');

        return $text !== '' ? $text : 'solution';
    }

    public static function uniqueSlug(\PDO $db, string $name, ?int $excludeId = null): string
    {
        $base = self::slugify($name);
        $slug = $base;
        $suffix = 2;

        while (self::slugExists($db, $slug, $excludeId)) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    /** Remplit les slugs manquants (migration / données existantes). */
    public static function backfillSlugs(\PDO $db): int
    {
        $stmt = $db->query('SELECT id, name FROM communities WHERE slug IS NULL OR slug = \'\'');
        $rows = $stmt ? $stmt->fetchAll() : [];
        $count = 0;

        foreach ($rows as $row) {
            $slug = self::uniqueSlug($db, (string) $row['name'], (int) $row['id']);
            $upd = $db->prepare('UPDATE communities SET slug = :slug WHERE id = :id');
            $upd->execute(['slug' => $slug, 'id' => (int) $row['id']]);
            $count++;
        }

        return $count;
    }

    private static function slugExists(\PDO $db, string $slug, ?int $excludeId = null): bool
    {
        $sql = 'SELECT id FROM communities WHERE slug = :slug';
        $params = ['slug' => $slug];
        if ($excludeId !== null) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $sql .= ' LIMIT 1';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetch();
    }

    /**
     * @param 'list'|'detail'|'private' $mode
     */
    public static function serialize(array $row, string $mode = 'list'): array
    {
        $out = [
            'id' => (int) $row['id'],
            'slug' => $row['slug'] ?? null,
            'userId' => isset($row['user_id']) ? (int) $row['user_id'] : null,
            'name' => $row['name'],
            'description' => $row['description'],
            'country' => $row['country'],
            'city' => $row['city'] ?? null,
            'tags' => json_decode($row['tags'] ?? '[]', true) ?: [],
            'lat' => isset($row['lat']) ? (float) $row['lat'] : null,
            'lng' => isset($row['lng']) ? (float) $row['lng'] : null,
            'status' => $row['status'],
            'pricingType' => $row['pricing_type'] ?? 'free',
            'priceAmount' => isset($row['price_amount']) ? (float) $row['price_amount'] : null,
            'currency' => $row['currency'] ?? 'XOF',
            'billingPeriod' => $row['billing_period'] ?? null,
            'appUrl' => $row['app_url'] ?? null,
            'demoUrl' => $row['demo_url'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
            'leaderName' => $row['leader_name'],
        ];

        foreach (self::SOCIAL_FIELDS as $jsonKey => $dbCol) {
            $out[$jsonKey] = $row[$dbCol] ?? null;
        }

        if ($mode === 'list') {
            return $out;
        }

        // Champs detail publics
        $out['shortDescription'] = $row['short_description'] ?? null;
        $out['mission'] = $row['mission'] ?? null;
        $out['leaderPhotoUrl'] = $row['leader_photo_url'] ?? null;
        $out['leaderBio'] = $row['leader_bio'] ?? null;
        $out['coLeads'] = json_decode($row['co_leads'] ?? '[]', true) ?: [];
        $out['gallery'] = json_decode($row['gallery'] ?? '[]', true) ?: [];
        $out['foundedYear'] = isset($row['founded_year']) ? (int) $row['founded_year'] : null;
        $out['memberCount'] = isset($row['member_count']) ? (int) $row['member_count'] : null;
        $out['meetingInfo'] = $row['meeting_info'] ?? null;
        $out['publicEmail'] = $row['public_email'] ?? null;

        if ($mode === 'private') {
            $out['leaderEmail'] = $row['leader_email'];
            $out['leaderPhone'] = $row['leader_phone'] ?? null;
        }

        if (isset($row['membership_role'])) {
            $out['membershipRole'] = $row['membership_role'];
        }

        return $out;
    }

    public static function serializeForAdmin(array $row): array
    {
        $out = self::serialize($row, 'private');
        $out['ownerName'] = $row['owner_name'] ?? null;
        $out['ownerEmail'] = $row['owner_email'] ?? null;
        return $out;
    }

    private static function nullableString($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return trim((string) $value);
    }
}
