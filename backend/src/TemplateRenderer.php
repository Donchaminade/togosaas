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
        ['key' => 'frontend_url', 'label' => 'URL du site (frontend)'],
    ];

    /** Variables additionnelles par declencheur. */
    private const BY_EVENT = [
        'community_submitted' => [['key' => 'solution', 'label' => 'Nom de la solution']],
        'community_approved' => [
            ['key' => 'solution', 'label' => 'Nom de la solution'],
            ['key' => 'statut', 'label' => 'Statut de la solution'],
            ['key' => 'community_url', 'label' => 'Lien public de la solution'],
            ['key' => 'share_linkedin', 'label' => 'Lien partage LinkedIn'],
            ['key' => 'share_whatsapp', 'label' => 'Lien partage WhatsApp'],
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
        'review_created' => [
            ['key' => 'solution', 'label' => 'Nom de la solution'],
            ['key' => 'rating', 'label' => 'Note attribuee (1-5)'],
            ['key' => 'rating_avg', 'label' => 'Note moyenne actuelle'],
            ['key' => 'reviews_count', 'label' => 'Nombre total d\'avis'],
        ],
        'rating_threshold' => [
            ['key' => 'solution', 'label' => 'Nom de la solution'],
            ['key' => 'rating_avg', 'label' => 'Note moyenne'],
            ['key' => 'reviews_count', 'label' => 'Nombre d\'avis'],
            ['key' => 'badge', 'label' => 'Nom du badge (ex. Top note)'],
        ],
        'report_filed' => [
            ['key' => 'solution', 'label' => 'Solution concernee'],
            ['key' => 'report_category', 'label' => 'Categorie du signalement'],
        ],
        'scheduled' => [
            ['key' => 'solution', 'label' => 'Nom de la solution (si applicable)'],
            ['key' => 'profile_pct', 'label' => 'Pourcentage de completude du profil'],
            ['key' => 'missing_fields', 'label' => 'Champs manquants'],
            ['key' => 'likes_week', 'label' => 'Likes de la semaine'],
            ['key' => 'reviews_week', 'label' => 'Avis de la semaine'],
            ['key' => 'rating_avg', 'label' => 'Note moyenne'],
            ['key' => 'cta_url', 'label' => 'URL du bouton d\'action'],
            ['key' => 'new_leads_week', 'label' => 'Nouveaux leads (digest admin)'],
            ['key' => 'pending_solutions', 'label' => 'Solutions en attente'],
            ['key' => 'pending_reports', 'label' => 'Signalements en cours'],
            ['key' => 'flagged_reviews', 'label' => 'Avis signales'],
            ['key' => 'failed_mails_week', 'label' => 'Emails en echec (7j)'],
            ['key' => 'category', 'label' => 'Tag / categorie thematique'],
            ['key' => 'share_linkedin', 'label' => 'Lien partage LinkedIn'],
            ['key' => 'share_whatsapp', 'label' => 'Lien partage WhatsApp'],
            ['key' => 'community_url', 'label' => 'Lien public de la solution'],
        ],
        'manual' => [
            ['key' => 'solution', 'label' => 'Nom de la solution (si applicable)'],
            ['key' => 'category', 'label' => 'Tag / categorie thematique'],
            ['key' => 'cta_url', 'label' => 'URL du bouton d\'action'],
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

    /** Contexte de base toujours disponible (date, site, frontend). */
    public static function baseContext(): array
    {
        return [
            'date' => date('d/m/Y'),
            'site' => (string) env('APP_NAME', 'TogoSaaS'),
            'frontend_url' => AutomationEngine::frontendUrl(),
        ];
    }
}
