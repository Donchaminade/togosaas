<?php

declare(strict_types=1);

namespace TCH;

/**
 * Rendu des modeles de message : remplace les variables {{cle}} par leurs
 * valeurs de contexte. Expose aussi la liste des variables disponibles par
 * type de declencheur (pour guider l'admin dans l'interface).
 */
final class TemplateRenderer
{
    /** Variables communes a tous les declencheurs. */
    private const COMMON = [
        ['key' => 'nom', 'label' => 'Nom du destinataire'],
        ['key' => 'email', 'label' => 'Email du destinataire'],
        ['key' => 'date', 'label' => 'Date du jour'],
        ['key' => 'site', 'label' => 'Nom du site'],
    ];

    /** Variables additionnelles par declencheur. */
    private const BY_EVENT = [
        'community_submitted' => [['key' => 'solution', 'label' => 'Nom de la solution']],
        'community_approved' => [
            ['key' => 'solution', 'label' => 'Nom de la solution'],
            ['key' => 'statut', 'label' => 'Statut de la solution'],
        ],
        'community_rejected' => [
            ['key' => 'solution', 'label' => 'Nom de la solution'],
            ['key' => 'statut', 'label' => 'Statut de la solution'],
        ],
        'report_status_changed' => [
            ['key' => 'solution', 'label' => 'Solution concernee'],
            ['key' => 'statut', 'label' => 'Statut du signalement'],
            ['key' => 'code', 'label' => 'Code de suivi du signalement'],
        ],
    ];

    /**
     * Remplace les {{cle}} de $text par les valeurs de $context.
     * Les cles inconnues sont remplacees par une chaine vide.
     */
    public static function render(string $text, array $context): string
    {
        return preg_replace_callback('/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/', static function ($m) use ($context) {
            $key = $m[1];
            $value = $context[$key] ?? '';
            return is_scalar($value) ? (string) $value : '';
        }, $text) ?? $text;
    }

    /**
     * Liste des variables disponibles pour un declencheur donne.
     *
     * @return list<array{key: string, label: string}>
     */
    public static function availableVariables(string $event): array
    {
        return array_merge(self::COMMON, self::BY_EVENT[$event] ?? []);
    }

    /** Contexte de base toujours disponible (date, site). */
    public static function baseContext(): array
    {
        return [
            'date' => date('d/m/Y'),
            'site' => (string) env('APP_NAME', 'TogoSaaS'),
        ];
    }
}
