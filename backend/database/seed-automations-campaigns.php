<?php

declare(strict_types=1);

/**
 * Seed des 15 campagnes email (templates + automatisations).
 *
 * Usage :
 *   php database/seed-automations-campaigns.php           # upsert DB + regen SQL
 *   php database/seed-automations-campaigns.php --sql-only # regen SQL uniquement
 *
 * Idempotence :
 *   - Modeles : UPSERT par name (subject/body/description mis a jour)
 *   - Automations : CREATE-ONLY par name (is_active respectee si deja presente)
 *   - Nouvelles autos creees avec is_active = 0
 *
 * Pre-requis Hostinger : importer upgrade-automations-campaigns.sql avant ce seed.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Ce script ne peut etre execute qu'en ligne de commande.\n");
}

$sqlOnly = in_array('--sql-only', $argv ?? [], true);

const BRAND_SITE_URL = 'https://togosaas.vercel.app';
const COLOR_GREEN = '#006A4E';
const COLOR_YELLOW = '#FFCE00';
const COLOR_RED = '#D21034';

$flagBand = static function (): string {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">'
        . '<tr style="height:6px;line-height:6px;font-size:0;">'
        . '<td width="33%" style="background-color:' . COLOR_GREEN . ';">&nbsp;</td>'
        . '<td width="34%" style="background-color:' . COLOR_YELLOW . ';">&nbsp;</td>'
        . '<td width="33%" style="background-color:' . COLOR_RED . ';">&nbsp;</td>'
        . '</tr></table>';
};

$ctaButton = static function (string $label, string $url): string {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 4px;">'
        . '<tr><td align="center" bgcolor="' . COLOR_GREEN . '" style="border-radius:8px;">'
        . '<a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" target="_blank" '
        . 'style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;'
        . 'font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">'
        . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</a>'
        . '</td></tr></table>';
};

$renderEmail = static function (string $bodyInner, string $ctaLabel, string $ctaUrl) use ($flagBand, $ctaButton): string {
    $flag = $flagBand();
    $cta = $ctaButton($ctaLabel, $ctaUrl);

    return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Togosaas</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr><td style="padding:0;">{$flag}</td></tr>
          <tr>
            <td align="center" style="padding:28px 32px 18px;">
              <img src="cid:brandlogo" alt="Togosaas — Hub SaaS du Togo" height="48" style="display:block;height:48px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#006A4E;letter-spacing:0.3px;">Togosaas</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;margin-top:4px;">Hub SaaS du Togo</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;">Bonjour {{nom}},</p>
{$bodyInner}
              <div style="text-align:center;margin:26px 0 6px;">
{$cta}
              </div>
            </td>
          </tr>
          <tr><td style="padding:0;">{$flag}</td></tr>
          <tr>
            <td style="padding:22px 32px 26px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#94a3b8;text-align:center;">
              <div style="margin-bottom:6px;">
                <a href="mailto:chaminade.dondah.adjolou@gmail.com" style="color:#006A4E;text-decoration:none;">chaminade.dondah.adjolou@gmail.com</a>
                &nbsp;·&nbsp;
                <a href="tel:+22899181626" style="color:#006A4E;text-decoration:none;">+228 99 18 16 26</a>
                &nbsp;·&nbsp;
                <span>Lomé, Togo</span>
              </div>
              <div style="margin-bottom:8px;">
                <a href="https://togosaas.vercel.app" target="_blank" style="color:#006A4E;text-decoration:none;font-weight:bold;">togosaas.vercel.app</a>
              </div>
              <div style="color:#cbd5e1;">© Togosaas — Hub SaaS du Togo</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
};

$p = static function (string $html): string {
    return '<p style="margin:0 0 16px;">' . $html . '</p>';
};

$templates = [
    'Publier ta solution' => [
        'subject' => '{{nom}}, publiez votre solution sur {{site}}',
        'description' => 'Invite les leads sans solution approuvee a publier ou completer leur SaaS.',
        'cta' => ['Publier ma solution', BRAND_SITE_URL . '/espace-lead/communautes/nouvelle'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Votre compte est pret, mais votre solution n\'est pas encore visible sur <strong>Togosaas</strong>.')
                . $p('Publier votre fiche permet aux Togolais de decouvrir votre SaaS, de vous contacter et de vous faire confiance. Quelques minutes suffisent pour demarrer.')
                . $p('Completez le nom, la description, un lien d\'acces et une capture — puis soumettez pour validation.'),
                'Publier ma solution',
                BRAND_SITE_URL . '/espace-lead/communautes/nouvelle'
            );
        },
    ],
    'Encouragement inactivite' => [
        'subject' => 'On croit en vous, {{nom}} — continuez votre aventure SaaS',
        'description' => 'Encouragement apres 3 semaines sans activite pertinente.',
        'cta' => ['Retourner sur mon espace', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Cela fait un moment que nous ne vous avons pas vu sur <strong>Togosaas</strong>. Pas de jugement : construire un produit demande du temps, surtout au Togo ou le quotidien peut etre exigeant.')
                . $p('Ne baissez pas les bras. Les solutions utiles aux Togolais — paiements, education, sante, commerce, administration — changent des vies. Votre idee peut en faire partie.')
                . $p('Ignorez les murmures et le decouragement autour de vous. Avancez pas a pas : une fiche claire, un lien qui marche, une premiere mise a jour. Nous sommes la pour vous accompagner.')
                . $p('Quand vous etes pret, reconnectez-vous a votre espace et reprenez la main.'),
                'Retourner sur mon espace',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Profil incomplet' => [
        'subject' => 'Votre fiche est complete a {{profile_pct}} %',
        'description' => 'Rappel aux leads reels dont le profil / la fiche est incomplete.',
        'cta' => ['Completer ma fiche', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Votre presence sur <strong>Togosaas</strong> est encore incomplete : <strong>{{profile_pct}} %</strong>.')
                . $p('Elements a renforcer : <strong>{{missing_fields}}</strong>.')
                . $p('Une fiche complete (telephone, galerie, liens, logo) inspire confiance et ameliore votre visibilite aupres des visiteurs.')
                . $p('Prenez quelques minutes pour completer votre espace lead.'),
                'Completer ma fiche',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Fiche en attente de validation' => [
        'subject' => '« {{solution}} » est toujours en revue',
        'description' => 'Rappel au lead que sa solution est en attente de validation.',
        'cta' => ['Voir mon tableau de bord', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Votre solution <strong>« {{solution}} »</strong> est toujours <strong>en attente de validation</strong> par notre equipe.')
                . $p('Nous examinons chaque soumission avec attention. Des que le statut evolue, vous recevrez un email. Vous pouvez suivre l\'avancement depuis votre tableau de bord.')
                . $p('Si vous souhaitez preciser des informations en attendant, connectez-vous a votre espace lead.'),
                'Voir mon tableau de bord',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Solution approuvée' => [
        'subject' => 'Votre solution « {{solution}} » est en ligne',
        'description' => 'Notification d\'approbation et de publication d\'une solution.',
        'cta' => ['Voir ma solution en ligne', '{{community_url}}'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Excellente nouvelle ! Votre solution <strong>« {{solution}} »</strong> a ete <strong>approuvee</strong> et est desormais en ligne sur Togosaas.')
                . $p('Statut actuel : <strong>{{statut}}</strong>. Elle est visible par toute la communaute du Hub SaaS du Togo.')
                . $p('Prochaine etape : partagez votre fiche pour attirer vos premiers visiteurs et avis.'),
                'Voir ma solution en ligne',
                '{{community_url}}'
            );
        },
    ],
    'Solution rejetée' => [
        'subject' => 'A propos de votre solution « {{solution}} »',
        'description' => 'Notification polie de refus, avec invitation a corriger et resoumettre.',
        'cta' => ['Modifier ma solution', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Merci d\'avoir soumis votre solution <strong>« {{solution}} »</strong>. Apres examen, nous ne pouvons pas la publier en l\'etat.')
                . $p('Statut actuel : <strong>{{statut}}</strong>.')
                . $p('Conseils : precisez la description, ajoutez des captures a jour, verifiez les liens et le positionnement. Puis soumettez a nouveau — nous serons heureux de reexaminer votre fiche.')
                . $p('Pour toute question, repondez simplement a cet email.'),
                'Modifier ma solution',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Nouveau avis ou note' => [
        'subject' => 'Nouvelle note sur « {{solution}} » : {{rating}}/5',
        'description' => 'Notifie le lead proprietaire quand un avis ou une note est depose.',
        'cta' => ['Voir ma solution', '{{community_url}}'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Bonne nouvelle : quelqu\'un vient de noter votre solution <strong>« {{solution}} »</strong>.')
                . $p('Note recue : <strong>{{rating}}/5</strong>. Moyenne actuelle : <strong>{{rating_avg}}</strong> sur <strong>{{reviews_count}}</strong> avis.')
                . $p('Consultez votre fiche pour suivre l\'engagement et repondre aux avis ecrits le cas echeant.'),
                'Voir ma solution',
                '{{community_url}}'
            );
        },
    ],
    'Badge Top note' => [
        'subject' => '« {{solution}} » obtient le badge {{badge}}',
        'description' => 'Felicitations lorsque le seuil Top note est atteint (moyenne et volume d\'avis).',
        'cta' => ['Voir ma fiche', '{{community_url}}'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Felicitations ! Votre solution <strong>« {{solution}} »</strong> atteint le seuil du badge <strong>{{badge}}</strong>.')
                . $p('Moyenne : <strong>{{rating_avg}}/5</strong> sur <strong>{{reviews_count}}</strong> avis. C\'est un signal fort de confiance pour vos visiteurs.')
                . $p('Continuez a soigner votre fiche et a partager votre lien pour amplifer cette dynamique.'),
                'Voir ma fiche',
                '{{community_url}}'
            );
        },
    ],
    'Digest hebdo engagement' => [
        'subject' => 'Votre semaine sur Togosaas — « {{solution}} »',
        'description' => 'Resume hebdomadaire likes / avis / note pour les leads avec solution approuvee.',
        'cta' => ['Ouvrir mon espace', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Voici le resume d\'engagement de la semaine pour <strong>« {{solution}} »</strong> :')
                . $p('• Likes cette semaine : <strong>{{likes_week}}</strong><br>• Avis cette semaine : <strong>{{reviews_week}}</strong><br>• Note moyenne : <strong>{{rating_avg}}</strong> (<strong>{{reviews_count}}</strong> avis au total)<br>• Likes au total : <strong>{{likes_count}}</strong>')
                . $p('Connectez-vous pour analyser ces signaux et actualiser votre fiche si besoin.'),
                'Ouvrir mon espace',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Mise a jour de fiche' => [
        'subject' => 'Pensez a actualiser « {{solution}} »',
        'description' => 'Rappel periodique (8-12 semaines) pour actualiser captures, prix et description.',
        'cta' => ['Mettre a jour ma fiche', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Cela fait un moment que votre fiche <strong>« {{solution}} »</strong> n\'a pas ete mise a jour.')
                . $p('Les visiteurs privilegient les informations fraiches : captures recentes, prix a jour, description claire, liens fonctionnels.')
                . $p('Prenez quelques minutes pour actualiser votre solution sur Togosaas.'),
                'Mettre a jour ma fiche',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Solution dormante' => [
        'subject' => 'Votre solution « {{solution}} » merite un petit coup de frais',
        'description' => 'Nudge doux pour solutions approuvees sans mise a jour depuis plusieurs semaines.',
        'cta' => ['Actualiser ma solution', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Votre solution <strong>« {{solution}} »</strong> est en ligne, mais elle n\'a pas ete mise a jour depuis un moment.')
                . $p('Un petit geste suffit souvent : une nouvelle capture, un prix ajusté, une phrase de mission plus claire. Cela aide les visiteurs a vous faire confiance.')
                . $p('Nous restons a vos cotes pour valoriser les SaaS made in Togo.'),
                'Actualiser ma solution',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Signalement sur votre solution' => [
        'subject' => 'Un probleme a ete signale sur « {{solution}} »',
        'description' => 'Notifie le lead qu\'un signalement a ete depose (sans exposer le signalant).',
        'cta' => ['Verifier ma fiche', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Un utilisateur a signale un probleme concernant votre solution <strong>« {{solution}} »</strong>.')
                . $p('Nature du signalement : <strong>{{report_category}}</strong>.')
                . $p('Aucun detail sur l\'auteur du signalement n\'est partage. Nous vous invitons a verifier vos liens, disponibilite du service et informations publiees. Notre equipe peut vous contacter si une action est necessaire.')
                . $p('Merci de contribuer a la fiabilite du Hub SaaS du Togo.'),
                'Verifier ma fiche',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Digest admin hebdomadaire' => [
        'subject' => 'Digest admin Togosaas — semaine du {{date}}',
        'description' => 'Resume hebdo pour admin/subadmin : leads, validations, moderation, echecs email.',
        'cta' => ['Ouvrir l\'admin', BRAND_SITE_URL . '/espace-admin'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Voici le digest hebdomadaire de la plateforme :')
                . $p('• Nouveaux leads (7j) : <strong>{{new_leads_week}}</strong><br>• Solutions en attente : <strong>{{pending_solutions}}</strong><br>• Signalements en cours : <strong>{{pending_reports}}</strong><br>• Avis signales (7j) : <strong>{{flagged_reviews}}</strong><br>• Emails en echec (7j) : <strong>{{failed_mails_week}}</strong>')
                . $p('Connectez-vous a l\'espace admin pour traiter les files prioritaires.'),
                'Ouvrir l\'admin',
                BRAND_SITE_URL . '/espace-admin'
            );
        },
    ],
    'Onboarding J3 — publier' => [
        'subject' => 'Jour 3 : publiez votre premiere solution',
        'description' => 'Etape J3 de la serie onboarding lead.',
        'cta' => ['Publier ma solution', BRAND_SITE_URL . '/espace-lead/communautes/nouvelle'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Vous etes inscrit depuis trois jours sur <strong>Togosaas</strong>. L\'etape suivante : publier votre solution SaaS.')
                . $p('Une fiche claire (nom, description, lien, capture) suffit pour demarrer le parcours de validation.')
                . $p('Plus vous publiez tot, plus vite votre produit peut etre decouvert par la communaute.'),
                'Publier ma solution',
                BRAND_SITE_URL . '/espace-lead/communautes/nouvelle'
            );
        },
    ],
    'Onboarding J7 — completer' => [
        'subject' => 'Jour 7 : completez galerie, equipe et presence',
        'description' => 'Etape J7 de la serie onboarding lead.',
        'cta' => ['Completer mon espace', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Une semaine deja sur <strong>Togosaas</strong> ! Pour maximiser votre impact :')
                . $p('1. Completer la <strong>galerie</strong> (captures a jour)<br>2. Renseigner l\'<strong>equipe</strong> (fondateur et co-membres)<br>3. Activer les <strong>notifications</strong> si proposees dans votre navigateur')
                . $p('Ces details renforcent la confiance et la conversion des visiteurs.'),
                'Completer mon espace',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
    'Partagez votre solution' => [
        'subject' => 'Partagez « {{solution}} » sur LinkedIn et WhatsApp',
        'description' => 'Reengagement post-approbation : partage social et lien catalogue.',
        'cta' => ['Voir ma fiche publique', '{{community_url}}'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Votre solution <strong>« {{solution}} »</strong> est en ligne. Le meilleur levier maintenant : la faire connaitre.')
                . $p('Partagez votre fiche :<br>• <a href="{{share_linkedin}}" style="color:#006A4E;">LinkedIn</a><br>• <a href="{{share_whatsapp}}" style="color:#006A4E;">WhatsApp</a><br>• Lien direct : <a href="{{community_url}}" style="color:#006A4E;">{{community_url}}</a>')
                . $p('Chaque partage augmente vos chances d\'obtenir des avis et de la traction locale.'),
                'Voir ma fiche publique',
                '{{community_url}}'
            );
        },
    ],
    'Campagne thematique' => [
        'subject' => 'Appel aux solutions {{category}} sur Togosaas',
        'description' => 'Modele pour campagne manuelle/planifiee filtree par tag (ex. fintech, education).',
        'cta' => ['Mettre a jour ma fiche', BRAND_SITE_URL . '/espace-lead'],
        'body' => static function () use ($p, $renderEmail): string {
            return $renderEmail(
                $p('Nous mettons en avant les solutions de la categorie <strong>{{category}}</strong> sur <strong>Togosaas</strong>.')
                . $p('Si votre produit <strong>« {{solution}} »</strong> s\'inscrit dans cette thematique, assurez-vous que votre fiche est complete, a jour et bien taguee.')
                . $p('C\'est le bon moment pour renforcer votre description, vos captures et vos liens d\'acces.'),
                'Mettre a jour ma fiche',
                BRAND_SITE_URL . '/espace-lead'
            );
        },
    ],
];

// Resolve body callables.
foreach ($templates as $name => &$tpl) {
    if (is_callable($tpl['body'])) {
        $tpl['body'] = $tpl['body']();
    }
}
unset($tpl);

/**
 * Automations : name => config
 * is_active always 0 on create.
 */
$automations = [
    // 1
    'Publier ta solution' => [
        'trigger' => 'scheduled',
        'template' => 'Publier ta solution',
        'audience' => 'leads_no_solution',
        'schedule' => ['mode' => 'weekly', 'dayOfWeek' => 2, 'time' => '09:00', 'cooldown_days' => 14],
    ],
    // 2
    'Encouragement inactivite 3 semaines' => [
        'trigger' => 'scheduled',
        'template' => 'Encouragement inactivite',
        'audience' => 'leads_inactive',
        'schedule' => ['mode' => 'daily', 'time' => '10:00', 'inactive_days' => 21, 'cooldown_days' => 21],
    ],
    // 3
    'Profil incomplet' => [
        'trigger' => 'scheduled',
        'template' => 'Profil incomplet',
        'audience' => 'leads_incomplete_profile',
        'schedule' => ['mode' => 'weekly', 'dayOfWeek' => 3, 'time' => '09:30', 'cooldown_days' => 14],
    ],
    // 4
    'Fiche en attente de validation' => [
        'trigger' => 'scheduled',
        'template' => 'Fiche en attente de validation',
        'audience' => 'leads_pending_review',
        'schedule' => ['mode' => 'daily', 'time' => '11:00', 'cooldown_days' => 7],
    ],
    // 5 — complete/améliore les autos existantes (noms historiques)
    'Notification approbation' => [
        'trigger' => 'community_approved',
        'template' => 'Solution approuvée',
        'audience' => 'event',
        'schedule' => null,
    ],
    'Notification rejet' => [
        'trigger' => 'community_rejected',
        'template' => 'Solution rejetée',
        'audience' => 'event',
        'schedule' => null,
    ],
    // 6
    'Nouveau avis ou note' => [
        'trigger' => 'review_created',
        'template' => 'Nouveau avis ou note',
        'audience' => 'event',
        'schedule' => ['cooldown_days' => 1],
    ],
    // 7
    'Badge Top note atteint' => [
        'trigger' => 'rating_threshold',
        'template' => 'Badge Top note',
        'audience' => 'event',
        'schedule' => ['cooldown_days' => 365],
    ],
    // 8
    'Digest hebdo engagement' => [
        'trigger' => 'scheduled',
        'template' => 'Digest hebdo engagement',
        'audience' => 'leads_with_solution',
        'schedule' => ['mode' => 'weekly', 'dayOfWeek' => 1, 'time' => '08:30', 'cooldown_days' => 6],
    ],
    // 9
    'Rappel mise a jour de fiche' => [
        'trigger' => 'scheduled',
        'template' => 'Mise a jour de fiche',
        'audience' => 'leads_stale_profile',
        'schedule' => ['mode' => 'monthly', 'dayOfMonth' => 1, 'time' => '09:00', 'stale_weeks' => 10, 'cooldown_days' => 56],
    ],
    // 10
    'Solution dormante' => [
        'trigger' => 'scheduled',
        'template' => 'Solution dormante',
        'audience' => 'leads_dormant_solution',
        'schedule' => ['mode' => 'weekly', 'dayOfWeek' => 4, 'time' => '09:00', 'dormant_weeks' => 6, 'cooldown_days' => 42],
    ],
    // 11
    'Signalement sur votre solution' => [
        'trigger' => 'report_filed',
        'template' => 'Signalement sur votre solution',
        'audience' => 'event',
        'schedule' => ['cooldown_days' => 1],
    ],
    // 12
    'Digest admin hebdomadaire' => [
        'trigger' => 'scheduled',
        'template' => 'Digest admin hebdomadaire',
        'audience' => 'admins',
        'schedule' => ['mode' => 'weekly', 'dayOfWeek' => 1, 'time' => '08:00', 'cooldown_days' => 6],
    ],
    // 13 — J0 = Bienvenue existante ; J3 / J7
    'Onboarding J3 — publier' => [
        'trigger' => 'scheduled',
        'template' => 'Onboarding J3 — publier',
        'audience' => 'leads_onboarding_d3',
        'schedule' => ['mode' => 'daily', 'time' => '09:15', 'cooldown_days' => 365],
    ],
    'Onboarding J7 — completer' => [
        'trigger' => 'scheduled',
        'template' => 'Onboarding J7 — completer',
        'audience' => 'leads_onboarding_d7',
        'schedule' => ['mode' => 'daily', 'time' => '09:20', 'cooldown_days' => 365],
    ],
    // 14
    'Partagez votre solution' => [
        'trigger' => 'community_approved',
        'template' => 'Partagez votre solution',
        'audience' => 'event',
        'schedule' => ['cooldown_days' => 30],
    ],
    // 15
    'Campagne thematique' => [
        'trigger' => 'manual',
        'template' => 'Campagne thematique',
        'audience' => 'category_tag',
        'schedule' => ['tag' => 'fintech', 'cooldown_days' => 30],
    ],
];

/* ------------------------------------------------------------------ */
/* SQL generator                                                      */
/* ------------------------------------------------------------------ */

$sqlEsc = static function (string $s): string {
    return str_replace(["\\", "'"], ["\\\\", "''"], $s);
};

$sqlParts = [];
$sqlParts[] = "-- ============================================================";
$sqlParts[] = "-- TogoSaaS - Seed 15 campagnes email (genere)";
$sqlParts[] = "-- Pre-requis : upgrade-automations-campaigns.sql";
$sqlParts[] = "-- Idempotent : INSERT ... WHERE NOT EXISTS / UPSERT modeles";
$sqlParts[] = "-- Nouvelles automatisations : is_active = 0 par defaut";
$sqlParts[] = "-- ============================================================";
$sqlParts[] = "";
$sqlParts[] = "SET NAMES utf8mb4;";
$sqlParts[] = "";
$sqlParts[] = "-- ----- Modeles de message (UPSERT par name) -----";

foreach ($templates as $name => $tpl) {
    $n = $sqlEsc($name);
    $s = $sqlEsc($tpl['subject']);
    $b = $sqlEsc($tpl['body']);
    $d = $sqlEsc($tpl['description']);
    $sqlParts[] = "UPDATE message_templates SET subject = '{$s}', body_html = '{$b}', description = '{$d}', updated_at = NOW() WHERE name = '{$n}';";
    $sqlParts[] = "INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)";
    $sqlParts[] = "SELECT '{$n}', '{$s}', '{$b}', '{$d}', NOW(), NOW()";
    $sqlParts[] = "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = '{$n}');";
    $sqlParts[] = "";
}

$sqlParts[] = "-- ----- Automatisations (CREATE-ONLY, is_active = 0) -----";

foreach ($automations as $name => $auto) {
    $n = $sqlEsc($name);
    $trigger = $sqlEsc($auto['trigger']);
    $tplName = $sqlEsc($auto['template']);
    $audience = $sqlEsc($auto['audience']);
    $sched = $auto['schedule'] !== null ? ("'" . $sqlEsc(json_encode($auto['schedule'], JSON_UNESCAPED_UNICODE)) . "'") : 'NULL';

    $nextRunExpr = 'NULL';
    if ($auto['trigger'] === 'scheduled' && is_array($auto['schedule'])) {
        // next_run_at sera calcule au 1er passage worker ; on pose une echeance proche.
        $nextRunExpr = "DATE_ADD(NOW(), INTERVAL 1 HOUR)";
    }

    $sqlParts[] = "INSERT INTO automations (name, trigger_event, template_id, is_active, audience, audience_user_ids, schedule_config, last_run_at, next_run_at, created_at, updated_at)";
    $sqlParts[] = "SELECT '{$n}', '{$trigger}', (SELECT id FROM message_templates WHERE name = '{$tplName}' ORDER BY id LIMIT 1), 0, '{$audience}', NULL, {$sched}, NULL, {$nextRunExpr}, NOW(), NOW()";
    $sqlParts[] = "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM automations WHERE name = '{$n}');";
    $sqlParts[] = "";
}

$sqlParts[] = "-- Fin du seed campagnes.";
$sqlContent = implode("\n", $sqlParts) . "\n";

$sqlPath = __DIR__ . '/seed-automations-campaigns.sql';
file_put_contents($sqlPath, $sqlContent);
echo "==> SQL ecrit : {$sqlPath} (" . strlen($sqlContent) . " octets)\n";

if ($sqlOnly) {
    echo "==> Mode --sql-only : pas d'ecriture DB.\n";
    exit(0);
}

require_once dirname(__DIR__) . '/src/bootstrap.php';

use TCH\AutomationEngine;
use TCH\Database;

$pdo = Database::connection();
echo "==> Seed DB des campagnes email\n";

$upsertTemplate = static function (PDO $pdo, string $name, string $subject, string $bodyHtml, string $description): array {
    $stmt = $pdo->prepare('SELECT id FROM message_templates WHERE name = :name LIMIT 1');
    $stmt->execute(['name' => $name]);
    $id = $stmt->fetchColumn();
    if ($id !== false) {
        $pdo->prepare(
            'UPDATE message_templates SET subject = :subject, body_html = :body_html, description = :description, updated_at = NOW() WHERE id = :id'
        )->execute([
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'description' => $description,
            'id' => (int) $id,
        ]);
        return [(int) $id, 'updated'];
    }
    $pdo->prepare(
        'INSERT INTO message_templates (name, subject, body_html, description, created_at, updated_at)
         VALUES (:name, :subject, :body_html, :description, NOW(), NOW())'
    )->execute([
        'name' => $name,
        'subject' => $subject,
        'body_html' => $bodyHtml,
        'description' => $description,
    ]);
    return [(int) $pdo->lastInsertId(), 'created'];
};

$ensureAutomation = static function (PDO $pdo, string $name, array $auto, int $templateId): array {
    $stmt = $pdo->prepare('SELECT id FROM automations WHERE name = :name LIMIT 1');
    $stmt->execute(['name' => $name]);
    $id = $stmt->fetchColumn();
    if ($id !== false) {
        return [(int) $id, false];
    }

    $schedule = $auto['schedule'];
    $scheduleJson = $schedule !== null ? json_encode($schedule, JSON_UNESCAPED_UNICODE) : null;
    $nextRun = null;
    if ($auto['trigger'] === 'scheduled' && is_array($schedule)) {
        $nextRun = AutomationEngine::computeNextRun($schedule, new DateTimeImmutable('now'));
        if ($nextRun === null) {
            $nextRun = (new DateTimeImmutable('+1 hour'))->format('Y-m-d H:i:s');
        }
    }

    $pdo->prepare(
        'INSERT INTO automations
            (name, trigger_event, template_id, is_active, audience, audience_user_ids,
             schedule_config, last_run_at, next_run_at, created_at, updated_at)
         VALUES
            (:name, :trigger_event, :template_id, 0, :audience, NULL,
             :schedule, NULL, :next, NOW(), NOW())'
    )->execute([
        'name' => $name,
        'trigger_event' => $auto['trigger'],
        'template_id' => $templateId,
        'audience' => $auto['audience'],
        'schedule' => $scheduleJson,
        'next' => $nextRun,
    ]);

    return [(int) $pdo->lastInsertId(), true];
};

$templateIds = [];
$createdT = 0;
$updatedT = 0;
foreach ($templates as $name => $tpl) {
    [$id, $action] = $upsertTemplate($pdo, $name, $tpl['subject'], $tpl['body'], $tpl['description']);
    $templateIds[$name] = $id;
    if ($action === 'created') {
        $createdT++;
        echo "  [OK] Modele cree : {$name}\n";
    } else {
        $updatedT++;
        echo "  [MAJ] Modele : {$name}\n";
    }
}

$createdA = 0;
$existingA = 0;
foreach ($automations as $name => $auto) {
    $tid = $templateIds[$auto['template']] ?? null;
    if ($tid === null) {
        echo "  [!] Modele manquant pour {$name}\n";
        continue;
    }
    [$id, $created] = $ensureAutomation($pdo, $name, $auto, $tid);
    if ($created) {
        $createdA++;
        echo "  [OK] Auto creee (inactive) : {$name}\n";
    } else {
        $existingA++;
        echo "  [=] Auto existante : {$name}\n";
    }
}

echo "\n==> Resume : modeles {$createdT} crees / {$updatedT} maj ; autos {$createdA} creees / {$existingA} existantes\n";
echo "    Activez-les une par une depuis Admin > Automatisations apres relecture.\n";
echo "    Cron Hostinger recommande (toutes les 5-15 min) :\n";
echo "      php /chemin/vers/backend/database/automations-worker.php\n";
