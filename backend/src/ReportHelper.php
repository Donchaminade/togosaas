<?php

declare(strict_types=1);

namespace TCH;

final class ReportHelper
{
    public const CATEGORIES = [
        'bug' => 'Dysfonctionnement technique / bug',
        'unavailable' => 'Service indisponible ou hors ligne',
        'outdated' => 'Informations erronées ou obsolètes',
        'broken_link' => 'Lien / accès non fonctionnel',
        'inappropriate' => 'Contenu inapproprié',
        'other' => 'Autre problème',
    ];

    /**
     * Anciennes catégories de signalement (orientées "abus").
     * Conservées UNIQUEMENT pour l'affichage des signalements historiques
     * deja enregistres en base. Elles ne sont plus proposees a la creation.
     */
    public const LEGACY_CATEGORIES = [
        'misinformation' => 'Informations fausses ou trompeuses',
        'harassment' => 'Harcèlement ou discrimination',
        'fraud' => 'Fraude ou arnaque',
        'illegal' => 'Contenu illégal',
    ];

    public const STATUS_LABELS = [
        'pending' => 'En attente',
        'investigating' => 'En cours d\'analyse',
        'resolved' => 'Traité',
        'dismissed' => 'Classé sans suite',
    ];

    public static function generateTrackingCode(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $parts = [];
        for ($p = 0; $p < 3; $p++) {
            $chunk = '';
            for ($i = 0; $i < 4; $i++) {
                $chunk .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $parts[] = $chunk;
        }
        return 'TCH-' . implode('-', $parts);
    }

    public static function serialize(array $row, bool $admin = false): array
    {
        $evidence = json_decode($row['evidence'] ?? '[]', true) ?: [];

        $out = [
            'id' => (int) $row['id'],
            'communityId' => (int) $row['community_id'],
            'communityName' => $row['community_name'] ?? null,
            'targetType' => $row['target_type'],
            'category' => $row['category'],
            'categoryLabel' => self::CATEGORIES[$row['category']] ?? self::LEGACY_CATEGORIES[$row['category']] ?? $row['category'],
            'description' => $row['description'],
            'evidenceCount' => count($evidence),
            'status' => $row['status'],
            'statusLabel' => self::STATUS_LABELS[$row['status']] ?? $row['status'],
            'createdAt' => $row['created_at'],
        ];

        if ($admin) {
            $out['trackingCode'] = $row['tracking_code'];
            $out['evidence'] = $evidence;
            $out['adminNotes'] = $row['admin_notes'] ?? null;
            $out['adminAction'] = $row['admin_action'] ?? null;
            $out['reviewedAt'] = $row['reviewed_at'] ?? null;
            $out['updatedAt'] = $row['updated_at'] ?? null;
            $out['ownerName'] = $row['owner_name'] ?? null;
            $out['ownerEmail'] = $row['owner_email'] ?? null;
            $out['ownerId'] = isset($row['owner_id']) ? (int) $row['owner_id'] : null;
            $out['leaderName'] = $row['leader_name'] ?? null;
        }

        return $out;
    }

    public static function serializePublicTrack(array $row): array
    {
        return [
            'trackingCode' => $row['tracking_code'],
            'status' => $row['status'],
            'statusLabel' => self::STATUS_LABELS[$row['status']] ?? $row['status'],
            'createdAt' => $row['created_at'],
            'reviewedAt' => $row['reviewed_at'] ?? null,
        ];
    }
}
